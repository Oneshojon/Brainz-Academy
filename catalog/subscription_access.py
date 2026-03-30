from functools import wraps
from django.shortcuts import redirect
from django.contrib import messages
from catalog.models import FreeUsageTracker, SubscriptionPlan
 
 
# ── Core subscription check ───────────────────────────────────────────────────
 
def get_active_subscription(user):
    """Returns the user's active UserSubscription or None."""
    return user.active_subscription  # uses cached property on model
 
 
def has_subscription(user, plan_type=None):
    """
    Check if user has an active subscription.
    plan_type: 'STUDENT_BASIC' | 'TEACHER_PRO' | None (any active)
    """
    sub = get_active_subscription(user)
    if not sub:
        return False
    if plan_type:
        return sub.plan.plan_type == plan_type
    return True
 
 
# ── Decorators ────────────────────────────────────────────────────────────────
 
def subscription_required(plan_type, redirect_to='/pricing/'):
    """
    Redirect to pricing page if user doesn't have the required plan.
 
    @subscription_required('TEACHER_PRO')
    def upload_docx(request): ...
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return redirect('/login/')
            if not has_subscription(request.user, plan_type):
                messages.warning(
                    request,
                    "This feature requires an active subscription. "
                    "Upgrade to get full access."
                )
                return redirect(redirect_to)
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator
 
 
# ── Practice session enforcement ──────────────────────────────────────────────
 
def check_practice_access(user):
    """
    Returns a dict describing what a user is allowed to do for practice.
 
    {
        'allowed':          True/False,   # can they start a session at all?
        'max_questions':    15 or 9999,   # question cap
        'sessions_left':    int,          # daily sessions remaining (free only)
        'is_free':          True/False,
        'reason':           str,          # shown to user if not allowed
    }
    """
    # Admins — unlimited
    if getattr(user, 'is_admin', False):
        return {
            'allowed':       True,
            'max_questions': 9999,
            'sessions_left': 9999,
            'is_free':       False,
            'reason':        '',
        }
    
    # Subscribed students — unlimited
    if has_subscription(user, 'STUDENT_BASIC'):
        return {
            'allowed':       True,
            'max_questions': 9999,
            'sessions_left': 9999,
            'is_free':       False,
            'reason':        '',
        }
 
    # Subscribed teachers get full practice access too
    if has_subscription(user, 'TEACHER_PRO'):
        return {
            'allowed':       True,
            'max_questions': 9999,
            'sessions_left': 9999,
            'is_free':       False,
            'reason':        '',
        }
 
    # Free tier — check daily limit
    tracker, _ = FreeUsageTracker.objects.get_or_create(user=user)
    if not tracker.can_start_session():
        return {
            'allowed':       False,
            'max_questions': FreeUsageTracker.FREE_QUESTION_LIMIT,
            'sessions_left': 0,
            'is_free':       True,
            'reason':        (
                f"You've used all {FreeUsageTracker.FREE_DAILY_SESSION_LIMIT} "
                f"free practice sessions for today. Come back tomorrow or "
                f"upgrade to practise without limits."
            ),
        }
 
    return {
        'allowed':       True,
        'max_questions': FreeUsageTracker.FREE_QUESTION_LIMIT,
        'sessions_left': tracker.sessions_remaining_today(),
        'is_free':       True,
        'reason':        '',
    }
 
 
# ── Test builder enforcement (teachers) ───────────────────────────────────────
 
def check_test_builder_access(user):
    """
    Returns a dict describing what a teacher can do in the test builder.
 
    {
        'allowed':          True/False,
        'is_free':          True/False,
        'trials_remaining': int,          # free only
        'max_questions':    15 or 9999,
        'pdf_only':         True/False,   # free teachers = PDF only
        'reason':           str,
    }
    """
    if getattr(user, 'is_admin', False):
        return {
            'allowed':          True,
            'is_free':          False,
            'trials_remaining': 9999,
            'max_questions':    9999,
            'pdf_only':         False,
            'reason':           '',
        }
    if has_subscription(user, 'TEACHER_PRO'):
        return {
            'allowed':          True,
            'is_free':          False,
            'trials_remaining': 9999,
            'max_questions':    9999,
            'pdf_only':         False,
            'reason':           '',
        }
 
    # Free teacher
    tracker, _ = FreeUsageTracker.objects.get_or_create(user=user)
    if not tracker.can_use_test_builder():
        return {
            'allowed':          False,
            'is_free':          True,
            'trials_remaining': 0,
            'max_questions':    FreeUsageTracker.FREE_QUESTION_LIMIT,
            'pdf_only':         True,
            'reason':           (
                f"You've used both free test builder trials. "
                f"Upgrade to Teacher Pro for unlimited access."
            ),
        }
 
    return {
        'allowed':          True,
        'is_free':          True,
        'trials_remaining': tracker.trials_remaining(),
        'max_questions':    FreeUsageTracker.FREE_QUESTION_LIMIT,
        'pdf_only':         True,
        'reason':           '',
    }

def check_lesson_note_access(user, topic):
    """
    Returns a dict describing whether a teacher can access lesson notes for a topic.
 
    {
        'allowed':         True/False,
        'is_free':         True/False,
        'already_accessed': True/False,   # True = revisit, no slot consumed
        'slots_remaining': int,
        'reason':          str,
    }
 
    Usage in lesson_notes view:
        access = check_lesson_note_access(request.user, selected_topic)
        if not access['allowed']:
            # show upgrade prompt
        else:
            FreeTeacherTopicAccess.record_access(request.user, selected_topic)
    """
    from catalog.models import FreeTeacherTopicAccess
 
    # Admins and subscribed teachers — always full access
    if getattr(user, 'is_admin', False) or has_subscription(user, 'TEACHER_PRO'):
        return {
            'allowed':          True,
            'is_free':          False,
            'already_accessed': False,
            'slots_remaining':  9999,
            'reason':           '',
        }
 
    # Free teacher
    already = FreeTeacherTopicAccess.has_accessed(user, topic)
    allowed, reason = FreeTeacherTopicAccess.can_access(user, topic)
 
    return {
        'allowed':          allowed,
        'is_free':          True,
        'already_accessed': already,
        'slots_remaining':  FreeTeacherTopicAccess.slots_remaining(user),
        'reason':           reason,
    }
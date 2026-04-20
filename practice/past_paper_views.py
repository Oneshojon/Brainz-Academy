from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.db.models import Count, Q
 
from catalog.models import ExamBoard, PastPaper
from catalog.cache_utils import (
    get_or_set,
    CACHE_1_HOUR,
    CACHE_5_MIN,
)
 
KEY_BOARDS_WITH_COUNTS = 'pp:boards_with_counts'
KEY_PAPERS_FOR_BOARD   = 'pp:papers_board_{board_id}'
 
 
@login_required
def past_papers_boards(request):
    def _fetch():
        qs = ExamBoard.objects.annotate(
            paper_count=Count(
                'series__past_papers',
                filter=Q(series__year__isnull=False),
                distinct=True,
            )
        ).order_by('name')
        return [
            {
                'id':           b.id,
                'name':         b.name,
                'abbreviation': b.abbreviation,
                'has_data':     b.paper_count > 0,
                'paper_count':  b.paper_count,
            }
            for b in qs
        ]
 
    boards = get_or_set(KEY_BOARDS_WITH_COUNTS, _fetch, CACHE_1_HOUR)
    return render(request, 'practice/past_papers_boards.html', {'boards': boards})
 
 
@login_required
def past_papers(request):
    board_id = request.GET.get('board')
    if not board_id:
        return redirect('past_papers:past_papers_boards')
 
    selected_board = get_or_set(
        f'pp:board_{board_id}',
        lambda: ExamBoard.objects.filter(pk=board_id).first(),
        CACHE_1_HOUR,
    )
    if not selected_board:
        return redirect('past_papers:past_papers_boards')
 
    def _fetch_papers():
        return list(
            PastPaper.objects
            .filter(
                exam_series__exam_board_id=board_id,
                exam_series__year__isnull=False,
            )
            .select_related(
                'exam_series',
                'exam_series__exam_board',
                'exam_series__subject',
            )
            .order_by(
                'exam_series__subject__name',
                '-exam_series__year',
                'exam_series__sitting',
                'paper_type',
            )
        )
 
    all_papers = get_or_set(
        KEY_PAPERS_FOR_BOARD.format(board_id=board_id),
        _fetch_papers,
        CACHE_5_MIN,
    )
 
    # Group by subject in one O(n) pass — no extra queries
    subjects_map = {}
    for paper in all_papers:
        subj = paper.exam_series.subject
        if subj.id not in subjects_map:
            subjects_map[subj.id] = {'subject': subj, 'papers': []}
        subjects_map[subj.id]['papers'].append(paper)
 
    all_subjects = list(subjects_map.values())
 
    # Selected subject
    selected_subject_id = request.GET.get('subject')
    selected_subject    = None
    papers_flat         = []
 
    if selected_subject_id:
        try:
            entry = subjects_map[int(selected_subject_id)]
            selected_subject = entry['subject']
            papers_flat      = entry['papers']
        except (KeyError, ValueError):
            pass
 
    # Selected paper — O(n) scan over at most a few dozen papers
    selected_paper_id = request.GET.get('paper')
    selected_paper    = None
 
    if papers_flat:
        if selected_paper_id:
            selected_paper = next(
                (p for p in papers_flat if str(p.id) == selected_paper_id),
                None,
            )
        if not selected_paper:
            selected_paper = papers_flat[0]
 
    return render(request, 'practice/past_papers.html', {
        'selected_board':   selected_board,
        'all_subjects':     all_subjects,
        'selected_subject': selected_subject,
        'papers_flat':      papers_flat,
        'selected_paper':   selected_paper,
    })

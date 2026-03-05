from django import template
from catalog.feature_flags import is_feature_enabled

register = template.Library()


@register.simple_tag(takes_context=True)
def feature_enabled(context, key):
    """
    {% feature_enabled 'lesson_notes' as flag_on %}
    {% if flag_on %}...{% endif %}
    """
    user = context.get('user')
    return is_feature_enabled(key, user=user)


class IfFeatureNode(template.Node):
    def __init__(self, key, nodelist_true, nodelist_false):
        self.key            = key
        self.nodelist_true  = nodelist_true
        self.nodelist_false = nodelist_false

    def render(self, context):
        user    = context.get('user')
        enabled = is_feature_enabled(self.key, user=user)
        if enabled:
            return self.nodelist_true.render(context)
        return self.nodelist_false.render(context)


@register.tag('if_feature')
def if_feature(parser, token):
    """
    {% if_feature 'lesson_notes' %}
        <a href="...">Notes</a>
    {% else_feature %}
        <span>Coming soon</span>
    {% end_if_feature %}
    """
    try:
        tag_name, key = token.split_contents()
        key = key.strip("\"' ")
    except ValueError:
        raise template.TemplateSyntaxError(
            f"{token.contents.split()[0]} requires exactly one argument"
        )
    nodelist_true = parser.parse(('else_feature', 'end_if_feature'))
    token2 = parser.next_token()
    if token2.contents == 'else_feature':
        nodelist_false = parser.parse(('end_if_feature',))
        parser.delete_first_token()
    else:
        nodelist_false = template.NodeList()
    return IfFeatureNode(key, nodelist_true, nodelist_false)
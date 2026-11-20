"""Convert a rendered fragment into a DOM tree for the offline interface checks."""
import json
import sys
from html.parser import HTMLParser


class Tree(HTMLParser):
    void = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = ['root', {}, '', [], '']
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        element = [tag, {k: v or '' for k, v in attrs}, '', [], '']
        self.stack[-1][3].append(element)
        if tag not in self.void:
            self.stack.append(element)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in self.void:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index][0] == tag:
                del self.stack[index:]
                break

    def handle_data(self, text):
        node = self.stack[-1]
        if node[3]:
            node[3][-1][4] += text
        else:
            node[2] += text


tree = Tree()
tree.feed(sys.stdin.read())
tree.close()
print(json.dumps(tree.root))

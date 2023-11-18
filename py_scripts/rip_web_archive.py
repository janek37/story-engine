import json
import logging
import re
import sys
import time
from typing import NamedTuple, Iterator, Any

import requests
from bs4 import BeautifulSoup
from requests import RequestException, Response

logger = logging.getLogger()

NOT_CREATED_TEXT = "This page has not been created.  If you log in, you can create this page and continue the story!"
MAINTENANCE_TEXT = "Currently undergoing work - we should be back up by the end of February!"

ARCHIVE_OVERRIDES = {
    "aabaaaaeca": "20040903185318",
}
INTERNAL_LINK_PATTERN = re.compile(
    r'href="https?://web.archive.org/web/[0-9]{14}/'
    r'https?://(?:www.)?qwantz.com(?::80)?/storyengine/index.asp\?pos=(?P<id>[a-e]+)"'
)


class Option(NamedTuple):
    text: str
    node_id: str

    def to_dict(self) -> dict[str, Any]:
        return {"text": self.text, "node_id": self.node_id}

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Option":
        return cls(**data)


class Node(NamedTuple):
    node_id: str
    text: str
    options: list[Option]
    author: str

    def to_dict(self) -> str:
        return json.dumps({
            "node_id": self.node_id,
            "text": self.text,
            "options": [option.to_dict() for option in self.options],
            "author": self.author,
        })

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Node":
        return cls(
            node_id=data["node_id"],
            text=data["text"],
            options=[Option.from_dict(opt) for opt in data["options"]],
            author=data["author"],
        )


def main():
    logging.basicConfig(level=logging.INFO)
    json.dump([node.to_dict() for node in iterate_nodes()], sys.stdout, indent=2, ensure_ascii=False)


def iterate_nodes() -> Iterator[Node]:
    # https://web.archive.org/web/timemap/json?url=qwantz.com/storyengine/index.asp&matchType=prefix&collapse=urlkey&output=json&fl=original&filter=!statuscode:[45]..&limit=10000
    archived_urls = json.load(sys.stdin)
    node_ids = [urls[0][urls[0].index('pos=') + 4:] for urls in archived_urls if 'pos=' in urls[0]]
    found_node_ids = []
    for node_id in node_ids:
        logging.info(f"processing node {node_id}")
        if node := get_node(node_id):
            yield node
            found_node_ids.append(node_id)

    yield from sorted(get_missing_nodes(found_node_ids), key=lambda n: n["node_id"])


def get_missing_nodes(node_ids: list[str]) -> Iterator[Node]:
    id_set = set(node_ids)
    for node_id in sorted(node_ids, key=len, reverse=True):
        parent_id = node_id[:-1]
        if len(node_id) > 1 and parent_id not in id_set:
            child_ids = (
                child_id
                for child_id in id_set
                if len(child_id) == len(node_id) and child_id.startswith(parent_id)
            )
            options = [Option(text=f"Option {i}", node_id=child_id) for i, child_id in enumerate(child_ids, start=1)]
            yield Node(node_id=parent_id, text="Missing node :(", options=options, author="")
            id_set.add(parent_id)


def get_node(node_id: str) -> Node | None:
    html = get_html(node_id)
    if NOT_CREATED_TEXT in html or MAINTENANCE_TEXT in html:
        return None
    soup = BeautifulSoup(html, features="html.parser")
    if node_id == "a":
        text = "Choose a story!"
        author = "ryan"
    else:
        font_elements = soup.find_all("font")
        raw_text = font_elements[3].decode_contents()
        if "<ul>" in raw_text:
            text = raw_text[:raw_text.index("<ul>")].strip()
        elif "<center>" in raw_text:
            text = raw_text[:raw_text.index("<center>")].strip()
        else:
            assert False  # does not happen
        if text.endswith("<p>"):
            text = text[:-len("<p>")].strip()
        text = INTERNAL_LINK_PATTERN.sub(r'href="/\g<id>"', text)
        author = font_elements[-2].text if len(font_elements) >= 6 else "unknown"
    if soup.ul:
        options = [Option(text=link.text, node_id=link.attrs["href"].split("=")[-1]) for link in soup.ul.find_all("a")]
    else:
        options = []
    return Node(node_id=node_id, text=text, options=options, author=author)


def get_html(node_id) -> str:
    timestamp = ARCHIVE_OVERRIDES.get(node_id, "20050201000000")
    archived_url = f'https://web.archive.org/web/{timestamp}/http://www.qwantz.com/storyengine/index.asp?pos={node_id}'
    while True:
        response = get_response(archived_url)
        if response.status_code == 404:
            assert False, f'Node {node_id} not found'
        else:
            if response.text:
                return response.text
            logger.info(f"empty response from url {archived_url}, retrying")


def get_response(url: str) -> Response:
    while True:
        try:
            time.sleep(4)
            return requests.get(url, headers={"User-Agent": "Story Engine Bot, contact: janek37@gmail.com"})
        except RequestException:
            logger.info(f"error from url {url}, retrying...")
            time.sleep(4)


if __name__ == '__main__':
    main()

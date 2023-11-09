import json
import logging
import time
from typing import NamedTuple, Iterator, Any

import requests
from bs4 import BeautifulSoup
from requests import RequestException, Response

logger = logging.getLogger()

NOT_CREATED_TEXT = "This page has not been created.  If you log in, you can create this page and continue the story!"
MAINTENANCE_TEXT = "Currently undergoing work - we should be back up by the end of February!"

ARCHIVE_OVERRIDES = {
    "aabaaaaeca": (
        "https://web.archive.org/web/20040903185318/http://www.qwantz.com/storyengine/index.asp?pos=aabaaaaeca"
    ),
}


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
    logger.setLevel(logging.INFO)
    for node in iterate_nodes("a"):
        print(node.to_dict())


def iterate_nodes(start_node: str) -> Iterator[Node]:
    known_ids = set()
    stack = [start_node]
    while stack:
        node_id = stack.pop()
        if node_id not in known_ids:
            logging.info(f"processing node {node_id}")
            if node := get_node(node_id):
                yield node
                known_ids.add(node.node_id)
                stack.extend(option.node_id for option in node.options)


def get_node(node_id: str) -> Node:
    html = get_html(node_id)
    if not html or NOT_CREATED_TEXT in html or MAINTENANCE_TEXT in html:
        text = "#not_found" if not html else "#not_created" if NOT_CREATED_TEXT in html else "#maintenance"
        return Node(node_id=node_id, text=text, options=[], author="")
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
        author = font_elements[-2].text if len(font_elements) >= 6 else "unknown"
    if soup.ul:
        options = [Option(text=link.text, node_id=link.attrs["href"].split("=")[-1]) for link in soup.ul.find_all("a")]
    else:
        options = []
    return Node(node_id=node_id, text=text, options=options, author=author)


def get_html(node_id) -> str | None:
    if node_id in ARCHIVE_OVERRIDES:
        archived_url = ARCHIVE_OVERRIDES[node_id]
    else:
        web_archive_url = f'https://archive.org/wayback/available?url=qwantz.com/storyengine/index.asp?pos={node_id}'
        response = get_response(web_archive_url).json()
        archived_url = response["archived_snapshots"]["closest"]["url"] if response["archived_snapshots"] else None
        if not archived_url:
            logger.info(response)
    if archived_url:
        while True:
            html = get_response(archived_url).text
            if html:
                return html
            logger.info(f"empty response from url {archived_url}, retrying")


def get_response(url: str) -> Response:
    while True:
        try:
            time.sleep(4)
            return requests.get(url, headers={"User-Agent": "Story Engine Bot, contact: janek37@gmail.com"})
        except RequestException:
            logger.info(f"error from url {url}, retrying...")


if __name__ == '__main__':
    main()

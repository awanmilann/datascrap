import re
import socket
from datetime import datetime
from typing import Optional
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup
from app.utils.security import validate_url_safety, sanitize_html


def extract_data(html: str, fields: list[str], custom_selector: Optional[str] = None) -> dict:
    html = sanitize_html(html)
    soup = BeautifulSoup(html, "lxml")
    result: dict = {}

    if "title" in fields:
        title = ""
        h1 = soup.find("h1")
        if h1:
            title = h1.get_text(strip=True)
        if not title:
            meta = soup.find("meta", attrs={"property": "og:title"}) or soup.find("meta", attrs={"name": "twitter:title"})
            if meta and meta.get("content"):
                title = meta["content"]
        if not title:
            title_tag = soup.find("title")
            if title_tag:
                title = title_tag.get_text(strip=True)
        result["title"] = title

    if "price" in fields:
        price = ""
        price_elem = soup.find(class_=re.compile(r"price", re.I))
        if price_elem:
            price = price_elem.get_text(strip=True)
        if not price:
            meta = soup.find("meta", attrs={"property": "product:price:amount"})
            if meta and meta.get("content"):
                price = meta["content"]
        result["price"] = price

    if "description" in fields:
        desc = ""
        meta_desc = soup.find("meta", attrs={"name": "description"}) or soup.find("meta", attrs={"property": "og:description"})
        if meta_desc and meta_desc.get("content"):
            desc = meta_desc["content"]
        if not desc:
            first_p = soup.find("p")
            if first_p:
                desc = first_p.get_text(strip=True)[:500]
        result["description"] = desc

    if "image_url" in fields:
        img_url = ""
        meta_img = soup.find("meta", attrs={"property": "og:image"}) or soup.find("meta", attrs={"name": "twitter:image"})
        if meta_img and meta_img.get("content"):
            img_url = meta_img["content"]
        if not img_url:
            first_img = soup.find("img")
            if first_img and first_img.get("src"):
                img_url = first_img["src"]
        result["image_url"] = img_url

    if "source_url" in fields:
        result["source_url"] = ""

    if "published_date" in fields:
        pub_date = ""
        meta_date = soup.find("meta", attrs={"property": "article:published_time"})
        if meta_date and meta_date.get("content"):
            pub_date = meta_date["content"]
        if not pub_date:
            time_elem = soup.find("time")
            if time_elem and time_elem.get("datetime"):
                pub_date = time_elem["datetime"]
        result["published_date"] = pub_date

    if custom_selector:
        custom = soup.select_one(custom_selector)
        if custom:
            result["custom_data"] = custom.get_text(strip=True)
        else:
            result["custom_data"] = ""

    return result


def validate_url(url: str) -> bool:
    return validate_url_safety(url)


async def check_robots_txt(domain: str) -> bool:
    try:
        parsed = urlparse(domain)
        if parsed.scheme:
            base = f"{parsed.scheme}://{parsed.netloc}"
        else:
            base = f"https://{domain}"
        robots_url = f"{base}/robots.txt"
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(robots_url, follow_redirects=True)
            if resp.status_code != 200:
                return True
            text = resp.text
            lines = text.splitlines()
            in_user_agent = False
            disallowed: list[str] = []
            for line in lines:
                stripped = line.strip()
                if stripped.lower().startswith("user-agent:"):
                    ua = stripped.split(":", 1)[1].strip()
                    in_user_agent = ua == "*" or ua.lower() == "dataharvest"
                elif in_user_agent and stripped.lower().startswith("disallow:"):
                    path = stripped.split(":", 1)[1].strip()
                    if path:
                        disallowed.append(path)
                elif stripped.lower().startswith("user-agent:"):
                    in_user_agent = False
            if disallowed:
                return False
            return True
    except Exception:
        return True


def is_private_ip(hostname: str) -> bool:
    try:
        addrs = socket.getaddrinfo(hostname, 80)
        for addr in addrs:
            ip = addr[4][0]
            if ip.startswith("10.") or ip.startswith("192.168.") or ip.startswith("172.") or ip.startswith("127.") or ip == "::1":
                return True
    except Exception:
        pass
    return False

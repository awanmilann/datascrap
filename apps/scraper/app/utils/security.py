import ipaddress
import re
import socket
from urllib.parse import urlparse

PRIVATE_IP_RANGES = [
    "127.0.0.0/8",
    "10.0.0.0/8",
    "172.16.0.0/12",
    "192.168.0.0/16",
    "::1/128",
    "fc00::/7",
    "fe80::/10",
]

BLOCKED_DOMAINS = [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "metadata.google.internal",
    "169.254.169.254",
]

BLOCKED_PROTOCOLS = ["file:", "ftp:", "smtp:", "ldap:", "gopher:"]


def _resolve_hostname(hostname: str) -> list[str]:
    try:
        return list(set(
            addr[4][0] for addr in socket.getaddrinfo(hostname, 80)
        ))
    except Exception:
        return []


def _is_private_ip_str(ip_str: str) -> bool:
    try:
        addr = ipaddress.ip_address(ip_str)
        for cidr in PRIVATE_IP_RANGES:
            if addr in ipaddress.ip_network(cidr):
                return True
    except ValueError:
        pass
    return False


def validate_url_safety(url: str) -> bool:
    try:
        parsed = urlparse(url)
    except Exception:
        return False

    if parsed.scheme not in ("http", "https"):
        return False

    for proto in BLOCKED_PROTOCOLS:
        if url.lower().startswith(proto):
            return False

    hostname = parsed.hostname or ""
    hostname_lower = hostname.lower()

    for blocked in BLOCKED_DOMAINS:
        if blocked in hostname_lower:
            return False

    ips = _resolve_hostname(hostname)
    for ip_str in ips:
        if _is_private_ip_str(ip_str):
            return False

    return True


def sanitize_html(html: str) -> str:
    html = re.sub(r"<script[^>]*>.*?</script>", "", html, flags=re.IGNORECASE | re.DOTALL)
    html = re.sub(r"<style[^>]*>.*?</style>", "", html, flags=re.IGNORECASE | re.DOTALL)
    html = re.sub(r"on\w+\s*=\s*\"[^\"]*\"", "", html, flags=re.IGNORECASE)
    html = re.sub(r"on\w+\s*=\s*'[^']*'", "", html, flags=re.IGNORECASE)
    html = re.sub(r"<iframe[^>]*>.*?</iframe>", "", html, flags=re.IGNORECASE | re.DOTALL)
    html = re.sub(r"<embed[^>]*>", "", html, flags=re.IGNORECASE)
    html = re.sub(r"<object[^>]*>.*?</object>", "", html, flags=re.IGNORECASE | re.DOTALL)
    return html

import re


def normalize_text(value: str) -> str:
    value = value.lower().strip()
    value = value.replace("ё", "e")

    value = re.sub(r"[^a-zа-я0-9]+", " ", value)
    value = re.sub(r"\s+", " ", value)

    return value.strip()


def normalize_sku(value: str) -> str:
    value = value.lower().strip()
    value = value.replace(" ", "")
    value = value.replace("-", "")
    value = value.replace("_", "")

    return value
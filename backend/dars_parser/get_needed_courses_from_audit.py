#!/usr/bin/env python3
"""
Parse a degree audit text file and extract courses the student still needs to take.

Usage:
  python3 get_needed_courses_from_audit.py [path/to/output_pdfminer.txt] [--json]

The script looks for "SELECT FROM:" blocks and "NEEDS:" contexts, then extracts
course tokens like "COM SCI 130", "MATH 170E", "EC ENGR M146" and handles
comma-separated numbers (e.g. "COM SCI 130,132" -> "COM SCI 130", "COM SCI 132").
"""
from __future__ import annotations

import argparse
import json
import re
from typing import List, Set, Tuple

DEPARTMENT_CODES = [
    "A&O SCI", "AERO ST", "AF AMER", "AF LANG", "AFRC ST", "AM IND", "AN N EA",
    "ANES", "ANTHRO", "APP CHEM", "APPLING", "ARABIC", "ARCH&UD", "ARCHEOL",
    "ARMENIA", "ART", "ART HIS", "ART&ARC", "ARTS ED", "ASIA AM", "ASIAN",
    "ASL", "ASTR", "BIOENGR", "BIOINFO", "BIOINFR", "BIOL CH", "BIOMATH",
    "BIOMATH", "BIOSTAT", "BMD RES", "BULGR", "C&EE", "C&EE ST", "C&S BIO",
    "CCAS", "CESC", "CH ENGR", "CHEM", "CHICANO", "CHIN", "CIVIC", "CLASSIC",
    "CLT HTG", "CLUSTER", "COM HLT", "COM LIT", "COM SCI", "COMM", "COMM ST",
    "COMPTNG", "CZCH", "DANCE", "DENT", "DESMA", "DGT HUM", "DIS STD",
    "DS BMED", "DUTCH", "EA STDS", "EC ENGR", "ECON", "EDUC", "EE BIOL",
    "EL ENGR", "ELTS", "ENGCOMP", "ENGL", "ENGR", "ENV HLT", "ENVIRON",
    "EPIDEM", "EPS SCI", "ESL", "ETHNMUS", "ETHNOMU", "FAM MED", "FIAT LX",
    "FILIPNO", "FILM TV", "FOOD ST", "FRNCH", "GE CLST", "GENDER", "GEOG",
    "GERMAN", "GJ STDS", "GLB HLT", "GLBL ST", "GRAD PD", "GREEK", "GRNTLGY",
    "HEBREW", "HIN-URD", "HIST", "HLT ADM", "HLT POL", "HNGAR", "HNRS",
    "HUM GEN", "I A STD", "I E STD", "I M STD", "IEP", "IL AMER", "INDO",
    "INF STD", "INTL DV", "IRANIAN", "ISLM ST", "ITALIAN", "JAPAN", "JEWISH",
    "KOREA", "LATIN", "LATN AM", "LAW", "LBR STD", "LBR&WS", "LGBTQS",
    "LGBTS", "LIFESCI", "LING", "LTHUAN", "M E STD", "M PHARM", "MAT SCI",
    "MATH", "MC&IP", "MCD BIO", "MECH&AE", "MED", "MED HIS", "MGMT",
    "MGMTEX", "MGMTFE", "MGMTFT", "MGMTGEX", "MGMTMFE", "MGMTMSA", "MGMTPHD",
    "MIA STD", "MIL SCI", "MIMG", "MOL BIO", "MOL TOX", "MOL TOX", "MSC HST",
    "MSC IND", "MUS HST", "MUS IND", "MUSC", "MUSCLG", "MUSCLGY", "MUSIC",
    "NAV SCI", "NEURBIO", "NEURLGY", "NEURO", "NEUROSC", "NEURSGY", "NONDEPT",
    "NR EAST", "NURSING", "OBGYN", "OPTH", "ORL BIO", "ORTHPDC", "PATH",
    "PBMED", "PEDS", "PHILOS", "PHYSCI", "PHYSICS", "PHYSIOL", "POL SCI",
    "POLSH", "PORTGSE", "PSYCH", "PSYCTRY", "PUB AFF", "PUB HLT", "PUB PLC",
    "QNT SCI", "RAD ONC", "RADIOL", "RE DEV", "RELIGN", "RES PRC", "ROMANIA",
    "RUSSN", "S ASIAN", "SCAND", "SCI EDU", "SEASIAN", "SEMITIC", "SLAVC",
    "SOC GEN", "SOC SC", "SOC THT", "SOC WLF", "SOCIOL", "SPAN", "SRB CRO",
    "STATS", "STATS", "SUMMER", "SURGERY", "SWAHILI", "THAI", "THEATER",
    "TURKIC", "UG-LAW", "UKRN", "UNIV ST", "URBN PL", "UROLOGY", "VIETMSE",
    "WL ARTS", "YIDDSH"
]


def find_select_blocks(text: str) -> List[Tuple[int, str]]:
    """Return a list of (start_index, block_text) for each 'SELECT FROM:' occurrence.
    Each block contains the text on the same line after the colon plus following
    non-empty lines (up to a reasonable boundary).
    """
    lines = text.splitlines()
    blocks: List[Tuple[int, str]] = []
    i = 0
    while i < len(lines):
        if 'SELECT FROM:' in lines[i]:
            # take remainder of the line after the colon
            part = lines[i].split('SELECT FROM:', 1)[1].strip()
            j = i + 1
            # collect following lines until a blank line or a control marker
            collected = [part] if part else []
            # skip any immediate blank lines and then collect lines that look
            # like option lists. Audits often place list items on separate lines
            # with blank lines in between, so do not stop on the first blank.
            while j < len(lines) and lines[j].strip() == '':
                j += 1
            while j < len(lines):
                ln = lines[j].strip()
                # if control markers appear, stop
                if ln.startswith('->') or ln.startswith('NEEDS') or ln.startswith('ALTERNATE') or ln.startswith('YOU') or ln.startswith('WARNING'):
                    break
                # stop if the next line looks like a term/year + course entry (e.g. 'SP25 EC ENGR M146')
                if re.match(r'^(FA|WI|SP|SU)\d{2,4}\b', ln):
                    break
                # skip and continue over empty lines between items
                if ln == '':
                    j += 1
                    continue
                # heuristics: if the line looks like a new section header (all-caps,
                # contains no digits or commas and is fairly short), assume we've
                # reached the next section and stop collecting
                if (ln.upper() == ln) and (not re.search(r"\d", ln)) and (',' not in ln) and len(ln.split()) <= 6:
                    break
                collected.append(ln)
                j += 1
            block_text = ' '.join(collected).strip()
            blocks.append((i, block_text))
            i = j
        else:
            i += 1
    return blocks


_course_token_re = re.compile(r"\b([A-Z&]{1,}(?:\s+[A-Z&\.]{1,}){0,2})\s*(?:([A-Z])\s*)?(\d{1,3}[A-Z0-9]*)\b")


def normalize_token(dept_part: str, mid_letter: str, number_part: str) -> str:
    """Build normalized course string from regex groups."""
    parts = []
    if dept_part:
        parts.append(' '.join(dept_part.split()))
    if mid_letter:
        # attach mid-letter directly to the number (e.g. 'M119')
        parts.append(f"{mid_letter}{number_part}")
    else:
        parts.append(number_part)
    return ' '.join(parts)


def extract_courses_from_block(block: str) -> List[str]:
    """Given a chunk (from SELECT FROM:) return a list of normalized course strings.

    Handles comma-separated shorthand where numbers follow a department (e.g. "COM SCI 130,132").
    """
    # normalize separators
    s = block.replace(';', ',')
    # also replace ' OR ' with placeholder to split options correctly later
    # but for now, we want to split by commas first to maintain current_dept flow

    # remove parenthetical annotations like '(FA23-9999)'
    s = re.sub(r'\([^)]*\)', '', s)

    # small set of common English words that can appear in surrounding prose
    STOP_WORDS = {'OF', 'AT', 'LEAST', 'UNITS', 'TWENTY', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'FROM', 'SELECT', 'THE', 'AND', 'THROUGH', 'TO', 'THRU'}
    # Single-letter prefixes that should attach to the most-recent department
    # (e.g. 'M151B' attached to 'COM SCI' -> 'COM SCI M151B'). Two-letter
    # prefixes like 'CM' are valid course prefixes and should NOT be attached
    # to the current department.
    SHORT_PREFIX_ATTACH = {'C', 'M'}

    # determine the most recent (last) full department token in the block
    def match_known_dept(tok: str) -> str:
        """Return canonical department from DEPARTMENT_CODES if tok matches, else None."""
        if not tok:
            return None
        cand = ' '.join(tok.upper().split())
        # exact match
        for d in DEPARTMENT_CODES:
            if cand == d:
                return d
        # Do NOT apply any prefix/startswith heuristics — only exact matches
        # map to known DEPARTMENT_CODES. This ensures short tokens like 'M' or
        # 'C' are treated as part of course codes, not departments.
        return None

    # We'll maintain a running `current_dept` while scanning tokens left-to-right.
    current_dept = None

    # Expand range patterns like 'COM SCI 111 TO 187', 'C111 TO C174', 'M119 TO M182', 'CM121 TO CM187'
    def expand_ranges(text: str) -> str:
        # Do expansion in two phases for robustness:
        # 1) Explicit letter-prefix forms like 'CM121 TO CM187' or 'C111 TO C174'
        #    where letters are attached to the number (no intervening dept words).
        # 2) Dept-word forms like 'COM SCI 111 TO 187'.

        # Handle hyphen ranges first: treat 'X 100-187' like 'X 100 TO 187'
        # Hyphen patterns appear in a few forms, e.g.:
        #  - 'COM SCI 100-187'  -> expand to 'COM SCI 100, COM SCI 101, ...'
        #  - 'CM121-187' or 'CM121-CM187' -> expand to 'CM121,CM122,...'
        # We'll perform several substitutions until stable.

        # prefix-number - prefix-number or prefix-number - number (e.g. 'CM121-CM187' or 'CM121-187')
        hyphen_prefix_re = re.compile(r"\b([A-Z]{1,3})(\d{1,3})\s*-\s*([A-Z]{1,3})?(\d{1,3})\b", re.IGNORECASE)

        def repl_hyphen_prefix(m: re.Match) -> str:
            p1 = m.group(1).upper()
            start_n = int(m.group(2))
            p2 = (m.group(3) or p1).upper()
            end_n = int(m.group(4))
            prefix = p1 if p1 == p2 else (p1 or p2)
            parts = [f"{prefix}{n}" for n in range(start_n, end_n + 1)]
            return ','.join(parts)

        # dept words followed by hyphen range: 'CH ENGR 100-187'
        hyphen_deptnum_re = re.compile(r"([A-Z][A-Z\s&\.]{0,20}?)\s+(\d{1,3})\s*-\s*(\d{1,3})", re.IGNORECASE)

        def repl_hyphen_deptnum(m: re.Match) -> str:
            dept_words = m.group(1).strip()
            start_n = int(m.group(2))
            end_n = int(m.group(3))
            dept = ' '.join(dept_words.upper().split())
            parts = [f"{dept} {n}" for n in range(start_n, end_n + 1)]
            return ','.join(parts)

        prev = None
        cur = text
        while prev != cur:
            prev = cur
            cur = hyphen_prefix_re.sub(repl_hyphen_prefix, cur)
            cur = hyphen_deptnum_re.sub(repl_hyphen_deptnum, cur)

        # Phase 1: prefix-number to prefix-number with explicit 'TO'
        prefix_re = re.compile(r"\b([A-Z]{1,3})(\d{1,3})\s+TO\s+([A-Z]{1,3})(\d{1,3})\b", re.IGNORECASE)

        def repl_prefix(m: re.Match) -> str:
            p1 = m.group(1).upper()
            start_n = int(m.group(2))
            p2 = m.group(3).upper()
            end_n = int(m.group(4))
            prefix = p1 if p1 == p2 else (p1 or p2)
            parts = [f"{prefix}{n}" for n in range(start_n, end_n + 1)]
            return ','.join(parts)

        prev = None
        while prev != cur:
            prev = cur
            cur = prefix_re.sub(repl_prefix, cur)

        # Phase 2: dept words followed by numbers (e.g. 'COM SCI 111 TO 187')
        deptnum_re = re.compile(r"([A-Z][A-Z\s&\.]{0,20}?)\s+(\d{1,3})\s+TO\s+(\d{1,3})", re.IGNORECASE)

        def repl_deptnum(m: re.Match) -> str:
            dept_words = m.group(1).strip()
            start_n = int(m.group(2))
            end_n = int(m.group(3))
            dept = ' '.join(dept_words.upper().split())
            parts = [f"{dept} {n}" for n in range(start_n, end_n + 1)]
            return ','.join(parts)

            cur = deptnum_re.sub(repl_deptnum, cur)

        # Phase 3: bare numbers (e.g. '100 TO 187' or '100-187')
        # We handle this last so that any dept-prefixed ranges are caught first.
        bare_re = re.compile(r"\b(\d{1,3})\s+(?:TO|-)\s+(\d{1,3})\b", re.IGNORECASE)

        def repl_bare(m: re.Match) -> str:
            start_n = int(m.group(1))
            end_n = int(m.group(2))
            if start_n < end_n and (end_n - start_n) < 100:  # sanity check range size
                parts = [str(n) for n in range(start_n, end_n + 1)]
                return ','.join(parts)
            return m.group(0)

        prev = None
        while prev != cur:
            prev = cur
            cur = bare_re.sub(repl_bare, cur)
        return cur

    s = expand_ranges(s)
    # split by commas but keep surrounding text for context
    parts = [p.strip() for p in s.split(',') if p.strip()]

    courses: List[str | Tuple[str, ...]] = []

    def get_courses_from_part(text_part: str) -> List[str]:
        nonlocal current_dept
        part_courses = []
        text_part = text_part.strip()
        if not text_part:
            return []

        # If the part starts with a leading number followed by another dept+number
        # (e.g. '30A LIFESCI 3'), split off the leading number and treat it
        # as an independent token that should attach to the most-recent
        # department. Then continue processing the remainder of the part.
        leading_split = re.match(r"^\s*(\d{1,3}[A-Z0-9]*)\s+(.+)$", text_part)
        if leading_split and current_dept:
            lead_num = leading_split.group(1)
            rest = leading_split.group(2).strip()
            # If the rest appears to start with a department word (all caps or has letters)
            # or contains a course-like token, treat the leading number as a separate token.
            if re.match(r"^[A-Z]", rest):
                part_courses.append(f"{current_dept} {lead_num}")
                # now reassign text_part to the remainder and continue processing it
                text_part = rest

        # If the part is a standalone prefix+number like 'CM121' and the prefix is 'CM',
        # attach the current department (if known). This handles expanded ranges
        # that produced tokens like 'CM121' and ensures they become 'COM SCI CM121'
        # (or whatever the current_dept is for the block).
        m_standalone_prefix = re.match(r'^([A-Z]{1,3})(\d{1,3}[A-Z0-9]*)$', text_part, re.IGNORECASE)
        if m_standalone_prefix:
            pfx = m_standalone_prefix.group(1).upper()
            num = m_standalone_prefix.group(2)
            if pfx == 'CM' and current_dept:
                part_courses.append(f"{current_dept} {pfx}{num}")
                return part_courses

        # Try to find a full course token inside the part
        m = _course_token_re.search(text_part)
        if m:
            dept_part, mid_letter, number_part = m.groups()
            # skip obvious prose matches like 'OF AT LEAST 5'
            if dept_part:
                toks = {t.upper().strip() for t in dept_part.split()}
                if toks & STOP_WORDS:
                    m = None

            if m:
                # Check if dept_part corresponds to a known department.
                known = match_known_dept(dept_part) if dept_part else None
                if known:
                    # it's a department: update current_dept and attach number
                    current_dept = known
                    number_str = f"{mid_letter}{number_part}" if mid_letter else number_part
                    part_courses.append(f"{current_dept} {number_str}")
                    return part_courses
                else:
                    # dept_part is not a known department (likely a short prefix like 'C' or 'M').
                    # If it's a short prefix (C/M/CM or <=2 chars) and we have a current_dept,
                    # attach the current_dept (most-recent rule). Otherwise, treat the
                    # dept_part as part of the course code itself (no department prepended).
                    raw_course = f"{dept_part}{mid_letter or ''}{number_part}" if dept_part else (f"{mid_letter}{number_part}" if mid_letter else number_part)
                    short_token = dept_part.replace(' ', '') if dept_part else ''
                    # attach only for explicit single-letter attachable prefixes
                    if short_token.upper() in SHORT_PREFIX_ATTACH and current_dept:
                        part_courses.append(f"{current_dept} {raw_course}")
                    else:
                        part_courses.append(raw_course)
                    return part_courses

        # If the part begins with a bare number followed by trailing prose (e.g. '181 TWENTY...'),
        # attach the last-seen department to that leading number.
        leading_num = re.match(r'^\s*(\d{1,3}[A-Z0-9]*)\b', text_part)
        if leading_num:
            num = leading_num.group(1)
            if current_dept:
                part_courses.append(f"{current_dept} {num}")
                return part_courses

        # If part looks like a prefix+number without space (e.g. 'C111', 'M119', 'CM121'), attach current_dept
        m_prefix_num = re.match(r'^([A-Z]{1,3})(\d{1,3}[A-Z0-9]*)$', text_part)
        if m_prefix_num:
            pfx = m_prefix_num.group(1).upper()
            num = m_prefix_num.group(2)
            # If prefix is a single-letter attachable prefix (e.g. 'C' or 'M'),
            # attach to current_dept. Two-letter prefixes like 'CM' should be
            # treated as standalone course prefixes and NOT attached.
            if pfx in SHORT_PREFIX_ATTACH:
                if current_dept:
                    part_courses.append(f"{current_dept} {pfx}{num}")
                else:
                    part_courses.append(f"{pfx}{num}")
                return part_courses
            # Otherwise, see if prefix matches a known department
            if len(pfx) <= 3:
                known = match_known_dept(pfx)
                if known:
                    current_dept = known
                    part_courses.append(f"{current_dept} {num}")
                    return part_courses
            # fallback: treat prefix as dept-like token
            current_dept = pfx
            part_courses.append(f"{pfx} {num}")
            return part_courses

        # if there's no full match, but the part is likely just a number (e.g. '132' or '152B')
        num_only = re.match(r'^(?:[A-Z]\s*)?(\d{1,3}[A-Z0-9]*)$', text_part)
        if num_only:
            num = num_only.group(1)
            if current_dept:
                course = f"{current_dept} {num}"
                part_courses.append(course)
                return part_courses
            # if no current_dept, append bare number
            part_courses.append(num)
            return part_courses

        # As a fallback, try to extract course-like tokens globally in the part
        for mm in _course_token_re.finditer(text_part):
            dept_part, mid_letter, number_part = mm.groups()
            # skip obvious prose matches like 'OF AT LEAST 5' by rejecting dept
            # tokens that are common stop-words or contain them
            if dept_part:
                toks = {t.upper().strip() for t in dept_part.split()}
                if toks & STOP_WORDS:
                    continue

            known = match_known_dept(dept_part) if dept_part else None
            # require numeric matches from free text to be at least two digits
            # unless the department is a known department. This avoids capturing
            # unit counts like '5' from surrounding prose.
            if (not known) and (not number_part or len(re.sub(r"[^0-9]", "", number_part)) < 2):
                continue

            if known:
                current_dept = known
                number_str = f"{mid_letter}{number_part}" if mid_letter else number_part
                part_courses.append(f"{current_dept} {number_str}")
            else:
                # unknown dept_part -> likely prefix as part of course code
                number_str = f"{dept_part}{mid_letter or ''}{number_part}" if dept_part else (f"{mid_letter}{number_part}" if mid_letter else number_part)
                part_courses.append(number_str)
        return part_courses

    for part in parts:
        part = part.strip()
        if not part:
            continue

        # Split by OR and process each subpart
        if ' OR ' in part.upper():
            subparts = re.split(r'\bOR\b', part, flags=re.IGNORECASE)
            sub_courses = []
            for sp in subparts:
                found = get_courses_from_part(sp)
                sub_courses.extend(found)
            if len(sub_courses) > 1:
                courses.append(tuple(sub_courses))
            elif sub_courses:
                courses.append(sub_courses[0])
        else:
            found = get_courses_from_part(part)
            courses.extend(found)

    # Deduplicate while preserving order
    seen: Set[str | Tuple[str, ...]] = set()
    ordered: List[str | Tuple[str, ...]] = []
    for c in courses:
        if isinstance(c, tuple):
            # normalize each item in tuple
            normalized_tuple = []
            for item in c:
                token = ' '.join(item.split()).split('(')[0].strip()
                normalized_tuple.append(token)
            c = tuple(normalized_tuple)
            if c not in seen:
                seen.add(c)
                ordered.append(c)
            continue

        # normalize spacing and strip parenthetical annotations
        token = ' '.join(c.split())
        token = token.split('(')[0].strip()
        # drop obvious term tokens (FA/WI/SP/SU etc) and tokens that are just a term+year like 'WI16'
        first = token.split()[0] if token.split() else ''
        if first in {'FA', 'WI', 'SP', 'SU', 'AP', 'WVC', 'FOOTHILL', 'TA'}:
            continue
        if re.match(r'^(FA|WI|SP|SU)\d{1,2}$', first.upper()):
            continue
        if re.match(r'^(FA|WI|SP|SU)\s*\d{1,2}$', token.upper()):
            continue
        if token not in seen:
            seen.add(token)
            ordered.append(token)
    return ordered



def extract_needed_courses(text: str) -> List[str]:
    """Top-level extraction. Scans for SELECT FROM blocks and returns found courses."""
    blocks = find_select_blocks(text)
    all_courses: List[str | Tuple[str, ...]] = []
    for idx, block in blocks:
        courses = extract_courses_from_block(block)
        if courses:
            all_courses.extend(courses)

    # Flatten nested OR groups for extract_needed_courses which expects a flat list
    flattened_courses: List[str] = []
    for c in all_courses:
        if isinstance(c, tuple):
            flattened_courses.extend(c)
        else:
            flattened_courses.append(c)
    all_courses = flattened_courses


    # Some audits also list 'SELECT FROM:' with range descriptions ("111 TO 187"). Keep them too.
    # Deduplicate final list and filter out obvious term tokens
    TERM_ABBRS = {'FA', 'WI', 'SP', 'SU', 'AP', 'WVC', 'FOOTHILL', 'TA'}

    def plausible_course(token: str) -> bool:
        # token format: '<DEPT_PART> <maybe_mid> <NUMBER>'
        parts = token.split()
        if not parts:
            return False
        prefix = parts[0]
        if prefix in TERM_ABBRS:
            return False
        # Avoid tokens starting with 'TO' or other non-department words
        if prefix in {'TO', 'OR', 'NOT', 'SELECT', 'NEEDS', 'ALTERNATE'}:
            return False
        return True

    seen: Set[str] = set()
    final: List[str] = []
    for c in all_courses:
        if not plausible_course(c):
            continue
        if c not in seen:
            seen.add(c)
            final.append(c)
    return final


def extract_requirements(text: str, taken_courses: Set[str] | None = None):
    """Return a list of requirements. Each requirement is a dict with:
       - 'needs': int or None (number of courses required)
       - 'options': list of course tokens (strings or tuples for OR)
       - 'needs_text': the raw NEEDS line(s) if available

    If taken_courses is provided, courses already taken are removed from options.
    If an OR tuple is reduced to a single element, it's flattened into a string.
    """
    if taken_courses is None:
        taken_courses = set()

    lines = text.splitlines()

    # --- TEMP SKIP LOGIC ---
    # Set this to False to re-enable SCI-TECH elective parsing
    TEMP_SKIP_SCI_TECH = True
    # -----------------------

    # find all SELECT FROM indices and their block text
    selects = []  # list of tuples (select_line_idx, block_text)
    for idx, line in enumerate(lines):
        if 'SELECT FROM:' in line:
            # extract block using existing helper-ish logic: reuse find_select_blocks by slicing
            # but simpler: capture remainder of line, then following non-empty lines
            part = line.split('SELECT FROM:', 1)[1].strip()
            j = idx + 1
            # skip any immediate blank lines
            while j < len(lines) and lines[j].strip() == '':
                j += 1
            collected = [part] if part else []
            while j < len(lines):
                ln = lines[j].strip()
                # stop on clear control markers
                if ln.startswith('->') or ln.startswith('NEEDS') or ln.startswith('ALTERNATE') or ln.startswith('YOU') or ln.startswith('WARNING'):
                    break
                # stop if a following line looks like a term/year + course entry (e.g. 'SP25 EC ENGR M146')
                if re.match(r'^(FA|WI|SP|SU)\d{2,4}\b', ln):
                    break
                # allow empty lines between list lines
                if ln == '':
                    j += 1
                    continue
                # if this looks like a new section header (uppercase, no digits/commas, short), stop
                if (ln.upper() == ln) and (not re.search(r"\d", ln)) and (',' not in ln) and len(ln.split()) <= 6:
                    break
                collected.append(ln)
                j += 1
            block_text = ' '.join(collected).strip()
            selects.append((idx, block_text))

    requirements = []
    for sel_idx, block in selects:
        # --- TEMP SKIP LOGIC ---
        if TEMP_SKIP_SCI_TECH:
            # Look back a few lines to see if this is a SCI-TECH elective block
            is_sci_tech = False
            for k in range(sel_idx - 1, max(sel_idx - 40, -1), -1):
                ln = lines[k].strip()
                if not ln:
                    continue
                # Match "SCI-TECH" or "SCITECH" or "SCI TECH"
                # We require the line to be all uppercase (as headers are) to avoid
                # matching prose/paragraphs that mention sci-tech.
                if re.search(r'SCI[-\s]?TECH', ln, re.IGNORECASE) and ln.upper() == ln:
                    is_sci_tech = True
                    break
                # If we hit a line that looks like a different section header, stop searching
                # We ignore control markers like 'NEEDS:' here.
                if (ln.upper() == ln) and (not re.search(r"\d", ln)) and (',' not in ln) and len(ln.split()) <= 10:
                    if 'NEEDS:' not in ln and 'SELECT FROM:' not in ln and '->' not in ln:
                        break
                # If we hit another SELECT FROM, we've definitely gone too far
                if 'SELECT FROM:' in ln:
                    break
            if is_sci_tech:
                continue
        # -----------------------

        # find nearest preceding 'NEEDS:' line within a reasonable window
        needs_idx = None
        for k in range(sel_idx - 1, max(sel_idx - 40, -1), -1):
            if 'NEEDS:' in lines[k]:
                needs_idx = k
                break

        needs_text = None
        needs_count = None
        if needs_idx is not None:
            # gather a few lines after NEEDS: to parse counts
            snippet = []
            m = needs_idx + 1
            # collect up to next 6 non-empty lines
            collected = 0
            while m < len(lines) and collected < 6:
                ln = lines[m].strip()
                if ln:
                    snippet.append(ln)
                    collected += 1
                m += 1
            needs_text = ' | '.join(snippet)
            # try to extract course count from snippet
            joined = '\n'.join(snippet)
            # look for e.g. '1 COURSE' or '3 COURSES'
            mnum = re.search(r"(\d+)\s+COURSE(S)?", joined, re.IGNORECASE)
            if mnum:
                try:
                    needs_count = int(mnum.group(1))
                except Exception:
                    needs_count = None

        options = extract_courses_from_block(block)

        # Filter out taken courses and flatten single-element tuples
        filtered_options = []
        for opt in options:
            if isinstance(opt, tuple):
                # Filter individual items in the tuple
                new_tuple = tuple(c for c in opt if c not in taken_courses)
                if len(new_tuple) == 1:
                    # Flatten to string if only one item remains
                    filtered_options.append(new_tuple[0])
                elif len(new_tuple) > 1:
                    # Keep as tuple if multiple items remain
                    filtered_options.append(new_tuple)
            else:
                # Regular string option
                if opt not in taken_courses:
                    filtered_options.append(opt)
        
        requirements.append({'needs': needs_count, 'options': filtered_options, 'needs_text': needs_text})

    return requirements


def main() -> None:
    parser = argparse.ArgumentParser(description='Extract needed courses from audit text')
    parser.add_argument('path', nargs='?', default='output_pdfminer.txt', help='Path to audit text file')
    parser.add_argument('--json', action='store_true', help='Output JSON list')
    args = parser.parse_args()

    with open(args.path, 'r', encoding='utf-8', errors='ignore') as f:
        text = f.read()

    # If the user wants to filter taken courses, we'll try to extract them if possible
    # For now, let's keep it simple and just run it for requirements.
    # We'll import extract_taken_courses locally to avoid circular dependency if it occurs
    # but based on the file structure it should be fine.
    try:
        from get_taken_courses import extract_taken_courses
        taken_data = extract_taken_courses(text)
        taken_courses = {c for q, c in taken_data}
    except ImportError:
        taken_courses = set()

    if args.json:
        # Output grouped requirements as JSON
        reqs = extract_requirements(text, taken_courses=taken_courses)
        print(json.dumps({'requirements': reqs}, indent=2))
        return

    # Human-readable grouped output
    reqs = extract_requirements(text, taken_courses=taken_courses)
    if not reqs:
        print('No explicit "SELECT FROM:" course options found in the audit.')
        return
    for i, r in enumerate(reqs, start=1):
        count = r.get('needs')
        opts = r.get('options') or []
        if count is None:
            count_txt = 'Unknown number of courses'
        elif count == 1:
            count_txt = '1 course'
        else:
            count_txt = f"{count} courses"

        formatted_opts = []
        for opt in opts:
            if isinstance(opt, tuple):
                formatted_opts.append(f"({' or '.join(opt)})")
            else:
                formatted_opts.append(opt)
        opts_txt = ', '.join(formatted_opts) if opts else '(no explicit options listed)'
        print(f"{count_txt} from {{{opts_txt}}}")


if __name__ == '__main__':
    main()

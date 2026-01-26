#!/usr/bin/env python3
"""Run DARS -> text -> extract needed courses pipeline.

Usage:
  python3 run_pipeline.py <input.pdf|input.txt> [--out-text OUTPUT] [--json]

If the input is a PDF, this will use `extract_dars_text.extract_text_pdfminer`
to convert it to text (saved to `--out-text` or `output_pdfminer.txt`). If the
input is a .txt file, it will be used directly. The script then calls
`get_needed_courses_from_audit.extract_requirements` and prints JSON or
human-readable output.
"""
from __future__ import annotations

import argparse
import json
import os
import sys

from typing import List

from extract_dars_text import extract_text_pdfminer, save_text_to_file
from get_taken_courses import extract_taken_courses
from get_needed_courses_from_audit import extract_requirements


def run_pipeline(input_path: str, out_text: str | None = None, to_json: bool = False):
    # Determine whether input is PDF or text
    is_pdf = input_path.lower().endswith('.pdf')
    is_txt = input_path.lower().endswith('.txt')

    if is_pdf:
        out_text = out_text or 'output_pdfminer.txt'
        print(f"Extracting text from PDF '{input_path}'...")
        txt = extract_text_pdfminer(input_path)
        save_text_to_file(txt, out_text)
        print(f"Successfully saved raw text to '{out_text}'")
        text = txt
    elif is_txt:
        out_text = out_text or input_path
        print(f"Using existing text file '{input_path}'")
        with open(input_path, 'r', encoding='utf-8', errors='ignore') as f:
            text = f.read()
    else:
        raise SystemExit('Input must be a .pdf or .txt file')

    # Extract taken courses
    taken_courses_data = extract_taken_courses(text)
    taken_courses_set = {c for q, c in taken_courses_data}

    # Extract requirements
    reqs = extract_requirements(text, taken_courses=taken_courses_set)

    if to_json:
        print(json.dumps({
            'taken_courses': [{'quarter': q, 'course': c} for q, c in taken_courses_data],
            'requirements': reqs
        }, indent=2))
    else:
        if taken_courses_data:
            print("Taken Courses:")
            print("-" * 50)
            for quarter, course_code in taken_courses_data:
                print(f"{quarter}: {course_code}")
            print()

        print("Needed Courses (Requirements):")
        print("-" * 50)
        if not reqs:
            print('No requirements parsed.')
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


def main(argv: List[str] | None = None) -> None:
    p = argparse.ArgumentParser(description='Run DARS -> text -> needed-courses pipeline')
    p.add_argument('input', help='Path to DARS PDF or extracted text file')
    p.add_argument('--out-text', help='Where to write extracted text (when input is PDF)')
    p.add_argument('--json', action='store_true', help='Print output as JSON')
    args = p.parse_args(argv)

    run_pipeline(args.input, out_text=args.out_text, to_json=args.json)


if __name__ == '__main__':
    main()

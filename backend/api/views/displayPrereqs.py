from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from api.models import DisplayPrereqs


def extract_course_ids(obj):

    ids = set()

    if isinstance(obj, dict):
        if "course" in obj:
            ids.add(obj["course"])

        for key in ("all_of", "any_of"):
            if key in obj and isinstance(obj[key], list):
                for item in obj[key]:
                    ids.update(extract_course_ids(item))

    elif isinstance(obj, list):
        for item in obj:
            ids.update(extract_course_ids(item))

    return ids


def course_prereqs(request, course_id):
    course = get_object_or_404(DisplayPrereqs, course_id=course_id)

    parsed = course.requisites_parsed or {}

    prereq_ids = list(extract_course_ids(parsed))

    return JsonResponse({
        "course_id": course_id,
        "prerequisites": prereq_ids,
        "requisites_parsed": parsed,
    })

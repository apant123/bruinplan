from django.urls import path
from api.views.courses import list_courses, course_prereqs, courses_by_ids, courses_by_labels

urlpatterns = [
    path("by-ids/", courses_by_ids),
    path("by-labels/", courses_by_labels),
    path("", list_courses),
    path("<int:subject_area_id>/", list_courses),
    path("<int:course_id>/requisites/", course_prereqs),
]
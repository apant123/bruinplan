from django.urls import path
from api.views.courses import list_courses, course_prereqs

urlpatterns = [
    path("", list_courses),
    path("<int:subject_area_id>/", list_courses),
    path("<int:course_id>/requisites/", course_prereqs),
]
from django.urls import path
from api.views.courseOfferings import list_courses

urlpatterns = [
    path("", list_courses),
    path("<str:term>/", list_courses),
]
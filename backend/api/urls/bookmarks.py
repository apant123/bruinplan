from django.urls import path
from api.views.bookmarks import manage_bookmarks

urlpatterns = [
    path("", manage_bookmarks),
    path("<int:course_id>/", manage_bookmarks),
]

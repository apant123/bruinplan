from django.urls import include, path

urlpatterns = [
    path("", include("api.urls.main")),   # main endpoints
    path("subjects/", include("api.urls.subjects")),  
]

from django.urls import path
from api.views.auth import createUser
from api.views.auth import loggedInUser

urlpatterns = [
    path("createUser/", createUser),
    path("user/", loggedInUser)

]
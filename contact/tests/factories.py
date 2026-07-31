"""factory_boy factory for ContactMessage."""

import factory
from factory.django import DjangoModelFactory

from contact.models import ContactMessage


class ContactMessageFactory(DjangoModelFactory):
    class Meta:
        model = ContactMessage

    category = ContactMessage.Category.INQUIRY
    name = factory.Faker("name")
    email = factory.Faker("email")
    subject = factory.Faker("sentence", nb_words=6)
    message = factory.Faker("paragraph", nb_sentences=3)
    status = ContactMessage.Status.NEW
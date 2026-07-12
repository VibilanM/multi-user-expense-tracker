Amount must be positive

Bad:

{
    "amount": -100
}

Bad:

{
    "amount": 0
}

Good:

{
    "amount": 250.50
}

Return

400 Bad Request

Example response:

{
    "message": "Amount must be greater than 0."
}
Rule 2
Category must belong to the user

Imagine this data.

Users
id	name
1	Alice
2	Bob
Categories
id	name	user_id
1	Food	1
2	Rent	1
3	Fuel	2

Now Alice submits:

{
    "user_id": 1,
    "category_id": 3
}

Category 3 belongs to Bob.

Your foreign key says:

Category exists.

That's true.

But your application says:

Alice cannot use Bob's category.

That's a business rule.

Validation flow becomes:

Does category exist?

↓

Yes

↓

Does category.user_id == expense.user_id ?

↓

No

↓

Reject request

This is a fantastic example of something the database cannot enforce with a simple foreign key. It requires application logic.

Rule 3
Duplicate category names

Suppose Alice already has:

Food

She tries to create

Food

again.

Reject.

But Bob creates

Food

Perfectly fine.

So:

Alice
------
Food
Rent

Bob
----
Food
Fuel

is valid.

But

Alice
------
Food
Food

is not.

How to check

Before inserting:

Is there already a category

WHERE

user_id = ?

AND

name = ?

If yes:

Return

409 Conflict

A 409 Conflict is more appropriate than 400 here because the request is syntactically valid—it just conflicts with existing data.

More business rules you could add
Description length
description <= 255 characters
Expense date

Don't allow:

2099-01-01

if future expenses aren't supported.

Maximum amount

Maybe

amount <= 10,000,000
Trim whitespace

Instead of

"     Food     "

store

Food
Empty category names

Reject

""

or

"     "
Email uniqueness

Two users shouldn't share the same email.

That's both:

a business rule
a database constraint (UNIQUE)
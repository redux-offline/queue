# smart-queue

## Description
When an action comes into the queue, check if another action is pending that is the same. Such
as "edit" or "create" and merge the data. If "edit" came in, but a "create" existed. If the
"create" is hanging merge the edit data to the "create". If "delete", then cancel the
"create".

When an action enters de queue, check if there's another action inside the queue that targets
the same resource, (will need to use a unique identifier). If the action exists, check the
method. The method can be one of following **CREATE**, **READ**, **UPDATE**, or **DELETE** (CRUD). Depending
on the method, we'll do one kind side-effect or anot****her.

## Side-Effects
> New action enters outbox -> Existing outbox action for same resource ->> outbox side-effect to 
apply
1. UPDATE action -> CREATE action ->> Merge UPDATE action into CREATE action.
2. DELETE action -> CREATE action ->> Remove CREATE action from outbox.
3. DELETE action -> UPDATE action ->> Replace UPDATE action with DELETE.
4. READ action -> READ action ->> Squash READ actions into a single action.

## Considerations

1. Behaviour should be effect agnostic, can't depend in default effect method.
2. When creating a new resource (CREATE), the app won't know the id of the resource. Another way 
of identifying resourced must be devised.
3. DELETE over CREATE must only delete the exact same resource (which is not straightforward). In
 example, if there's two TODOs with CREATE method, a new DELETE method action, should be able to 
 remove only one of those two actions, and this should be the correct one. 

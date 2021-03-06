# Model

## Import

```typescript
import { Model, model } from 'active-record-js';
```

## Descriptions

#### Model

The base model that corresponds to a database table.

#### model - decorator

The model decorator registers a model class internally to a store of models.
The purpose of the store is to locate other models for relationships, without
having to import them directly, or deal with circular dependencies.

## Definition

```typescript
// Add the model to the model store - required
@model
class User extends Model
{
    public static table = 'users';
}

export default User;
```

```typescript
// Retrieve a user by id
const user = await User.findById(1);
const users = await User.where('age', '>', 18).get();
```

## Instances


#### Define a model

```typescript
@model
class User extends Model
{
    public static table = 'users';
}
```

#### Create a new instance

```typescript
const user = new User();

user.firstName = 'test';
user.lastName = 'user';
const success = await user.save();
```

#### Update existing

```typescript
const user = await User.findById(1);

user.age = user.age + 1;
const success = await user.save();
```

#### Mass Updates

```typescript
const success = await User
    .where('flagged', '=', true)
    .update({
        banned: true
    });
```

#### Deletion

```typescript
const user = await User.findById(1);
const success = await user.delete();
```

#### Mass Deletion

```typescript
const success = await User.where('flagged', '=', true).delete();
```


## Accessors

Accessors can allow specifying additional attributes on a Model. They can be accessed as if they are a regular attribute.
- Accessors must follow the naming convention ```{attributeName}Attribute(attributes: object)```
- Accessors can be called directly as a property of the model instance.
- Accessors can also be used to mutate an existing property. The property will be overwritten by the result of the function.

```typescript
@model
class User extends Model
{
    public static table 'users';

    public fullNameAttribute(attributes): string
    {
        return `${attributes.firstName} ${attributes.lastName}`;
    }
}

const user = new User({firstName: 'test', lastName: 'user'});
user.fullName // 'test user'
```

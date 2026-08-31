---
title: "【翻译】理解TypeScript中的infer"
date: '2023-02-25'
tags: ["typescript"]
---
原文：[Understanding infer in TypeScript](https://blog.logrocket.com/understanding-infer-typescript/)

大家都用过不爱写类型的库。就以下面这个这个第三方函数为例：

```typescript
function describePerson(person: {
  name: string;
  age: number;
  hobbies: [string, string]; // 元组
}) {
  return `${person.name} is ${person.age} years old and love ${person.hobbies.join(" and  ")}.`;
}
```

如果库里没给`describePerson`的参数`person`单独写个类型，那TypeScript会无法正确推断定义的`person`变量的类型。

```typescript
const alex = {
  name: 'Alex',
  age: 20,
  hobbies: ['walking', 'cooking'] // 类型 string[] != [string, string]
}

describePerson(alex) /* 不能将类型 string[] 分配给类型 [string, string] 。 */
```

TypeScript会将`alex`的类型推断为`{ name: string; age: number; hobbies: string[] }`且不允许其作为`describePerson`的参数。

而且，就算它允许，也最好对`alex`做个类型检查，确保有正确的自动补全。归功于TypeScript的`infer`关键词，这其实很容易做到。

```typescript
const alex: GetFirstArgumentOfAnyFunction<typeof describePerson> = {
  name: "Alex",
  age: 20,
  hobbies: ["walking", "cooking"],
};

describePerson(alex); /* No TypeScript errors */
```

TypeScript中的`infer`关键词与条件类型允许我们将一个类型与其任意部分进行隔离后使用。

## 没有值的`never`类型

在TypeScript里，`never`被当作“没有值”的类型。你将会经常看到它作为一个dead-end类型。一个联合类型，比如`string | never`，在TypeScript中与`string`等价，忽略`never`。

方便理解，你可以把`string`和`never`当作数学集合，其中`string`是个包含了所有字符串值的集合，`never`是个没有值的集合（[∅空集](https://zh.m.wikipedia.org/wiki/%E7%A9%BA%E9%9B%86)）。这样两个集合的并集，显然是前者。

反之，`string | any`的组合结果为`any`。同样，你可以将这当成`string`集合与包含所有集合的[全集](https://en.wikipedia.org/wiki/Universal_set)（U）的组合，显而易见的，等价于其自身。

这就解释了为什么将`never`作为出口，因为它在与其他类型组合后将消失。

## 在TypeScript中使用条件类型

条件类型通过对特性约束的满足与否来对类型进行操作。看起来像是JavaScript里的三元运算符。

## `extends`关键词

在TypeScript中，通过`extends`关键词来表达约束。`T extends K`意为可以安全地假设一个类型为`T`的值同时也类型为`K`。例如`0 extends number`是成立的，因为`var zero: number = 0`是类型安全的。

因此，我们可以检查一个泛型是否满足约束，依此返回不同的类型。

`StringFromType`返回一个接受参数的原始类型的字符串：

```typescript
type StringFromType<T> = T extends string ? 'string' : never

type lorem = StringFromType<'lorem ipsum'> // 'string'
type ten = StringFromType<10> // never
```

> 译注
> 
> `lorem`类型为’string’，该类型名为’string’，值只可为’string’。

为了让`StringFromType`的泛型覆盖更全面，我们可以连接更多条件，就像JavaScript里嵌套的三元运算符一样。

```typescript
type StringFromType<T> = T extends string
  ? 'string'
  : T extends boolean
  ? 'boolean'
  : T extends Error
  ? 'error'
  : never

type lorem = StringFromType<'lorem ipsum'> // 'string'
type isActive = StringFromType<false> // 'boolean'
type unassignable = StringFromType<TypeError> // 'error'
```

## 条件类型与联合

将一个联合类型拓展成一个约束，TypeScript会将遍历联合的成员并返回联合自身：

```typescript
type NullableString = string | null | undefined

type NonNullable<T> = T extends null | undefined ? never : T // 内置类型，供参考

type CondUnionType = NonNullable<NullableString> // 等价于`string`
```

TypeScript将会通过遍历联合`string | null | undefined`来测试约束`T extends null | undefined`，一次一个类型。

你可以将过程看作下面这段说明代码：

```typescript
type stringLoop = string extends null | undefined ? never : string // string

type nullLoop = null extends null | undefined ? never : null // never

type undefinedLoop = undefined extends null | undefined ? never : undefined // never

type ReturnUnion = stringLoop | nullLoop | undefinedLoop // string
```

因为`ReturnUnion`是一个`string | never | never`的联合，它等价于`string`（看上文说明）。

你可以看到TypeScript中的内置工具类型`Extract`与`Exclude`是如何从拓展后的联合中提取泛型来构建的：

```typescript
type Extract<T, U> = T extends U ? T : never
type Exclude<T, U> = T extends U ? never : T
```

## 条件类型与函数

检查一个类型是否派生自某个函数外观，一定不能用`Function`类型。取而代之的，下面这个函数签名可以用于拓展所有可能的函数：

```typescript
type AllFunctions = (...args: any[]) => any
```

> 译注
> 
> 函数外观一词原文为 _function shape_ ，概念与函数签名类似，故译作函数外观。

`...args: any[]`能涵盖零个或多个参数，而`=> any`能涵盖所有的返回类型。

## 在TypeScript中使用`infer`

`infer`关键词补全了条件类型，且不能在`extends`语句以外使用。`infer`允许我们在约束中定义变量，以供引用或返回。

以TypeScript内置的`ReturnType`工具为例。它接受一个函数类型并提供其返回类型：

```typescript
type a = ReturnType<() => void> // void
type b = ReturnType<() => string | number> // string | number
type c = ReturnType<() => any> // any
```

其逻辑为先检查类型参数（`T`）是否为函数，且在检查过程中通过`infer R`将返回类型转为变量，然后在成功后返回：

```typescript
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : any;
```

如前文所述，这在需要访问与使用那些不可用的类型时很有用。

## React prop types

在React中，我们经常需要访问prop的类型。为此，React提供了一个工具类型用于访问prop类型，名为`ComponentProps`，通过`infer`实现。

```typescript
type ComponentProps<
  T extends keyof JSX.IntrinsicElements | JSXElementConstructor<any>
> = T extends JSXElementConstructor<infer P>
  ? P
  : T extends keyof JSX.IntrinsicElements
  ? JSX.IntrinsicElements[T]
  : {}
```

检查确认类型参数为React组件后，它将props推导并返回。如果失败，它将检查类型参数是否为`IntrinsicElements`（`div`,`button`，等等）并返回其prop。如果都失败，返回`{}`，它在TypeScript中意为“任意非空值”。

> 译注
> 
> {} 在TypeScript中的含义比较确切地说应该为：没有任何必要属性的类型。

## `infer`关键词的使用场景

使用`infer`关键词经常被解释为展开一个类型。这里有一些`infer`关键词的常用例子。

### 函数的第一个参数

这是我们第一个例子的解决方案：

```typescript
type GetFirstArgumentOfAnyFunction<T> = T extends (
  first: infer FirstArgument,
  ...args: any[]
) => any
  ? FirstArgument
  : never

type t = GetFirstArgumentOfAnyFunction<(name: string, age: number) => void> // string
```

### 函数的第二个参数

```typescript
type GetSecondArgumentOfAnyFunction<T> = T extends (
  first: any,
  second: infer SecondArgument,
  ...args: any[]
) => any
  ? SecondArgument
  : never

type t = GetSecondArgumentOfAnyFunction<(name: string, age: number) => void> // number
```

### Promise的返回类型

```typescript
type PromiseReturnType<T> = T extends Promise<infer Return> ? Return : T

type t = PromiseReturnType<Promise<string>> // string 
```

### 数组的类型

```typescript
type ArrayType<T> = T extends (infer Item)[] ? Item : T

type t = ArrayType<[string, number]> // string | number
```

## 总结

`infer`关键词是TypeScript中一个允许我们在使用第三方代码时可以去展开与存储类型的有力工具。本文中，我们通过`never`关键词，`extends`关键词，联合，函数签名，对编写健壮条件类型的各个方面进行了阐述。

---
title: 将Haskell中的ADT与GADT在Java中实现
date: 2020-10-21
tags:
  - 函数式
---
首先感谢雨轩老师

本篇为 20-21 日雨轩老师于 \[数据删除\] 演讲内容的整理笔记，以下代码仅为对雨轩老师代码的小部分修改与重新排版

## ADT

[Algebraic data type -Wikipedia](https://en.wikipedia.org/wiki/Algebraic_data_type)

### 代码

以`Either`为例

_Haskell_

```haskell
data Either a b = Left a | Right b
```

_Java_

```java
public abstract class Either<A, B> {
    public static <A, B> Either<A, B> left(A left) {
        return new Left<>(left);
    }

    public static <A, B> Either<A, B> right(B right) {
        return new Right<>(right);
    }

    public abstract <R> R match(Left.Case<A, B, R> caseLeft,
                                Right.Case<A, B, R> caseRight);

    public static final class Left<A, B> extends Either<A, B> {
        final A left;

        Left(A left) {
            this.left = left;
        }

        @Override
        public <R> R match(Left.Case<A, B, R> caseLeft,
                           Right.Case<A, B, R> caseRight) {
            return caseLeft.caseLeft(left);
        }

        public interface Case<A, B, R> {
            R caseLeft(A left);
        }
    }

    public static final class Right<A, B> extends Either<A, B> {
        final B right;

        Right(B right) {
            this.right = right;
        }

        @Override
        public <R> R match(Left.Case<A, B, R> caseLeft,
                           Right.Case<A, B, R> caseRight) {
            return caseRight.caseRight(right);
        }

        public interface Case<A, B, R> {
            R caseRight(B right);
        }
    }
}
```

测试:

_Haskell_

```haskell
showEither :: (Show a, Show b) => Either a b -> String
showEither (Left x) = "Left[" ++ show x ++ "]"
showEither (Right x) = "Right[" ++ show x ++ "]"

main :: IO()
main = do
  putStrLn . showEither $ Left "foo" -- Left["foo"]
  putStrLn . showEither $ Right 12450 -- Right[12450]
```

_Java_

```java
public class EitherTest {
    public static <A, B> String showEither(Either<A, B> either) {
        return either.match(
                l -> "Left[" + l + "]",
                r -> "Right[" + r + "]"
        );
    }
    
    public static void main(String[] args) {
        System.out.println(showEither(left("foo"))); // Left[foo]
        System.out.println(showEither(right(12450))); // Right[12450]
    }
}
```

### Encode 思路

将_Haskell_的`Either`与其中的`Left`与`Right`两个`Constructor`在_Java_中写为`Either`类与两个子类；

_Java_中`Either`的`match`方法依赖于`Left`与`Right`各自的`Case`接口；

`Left`与`Right`各自的`Case`接口与`match`函数重写进行对自身类型的_match_；

`match`函数使得外界能够对`Either`进行_Pattern Match_并可以通过简单的_lambda_进行操作。

## GADT

[Generalized algebraic data type -Wikipedia](https://en.wikipedia.org/wiki/Generalized_algebraic_data_type)

让我断章取义一下:

> Explicit instantiation of the ADT
> 
> \-Wikipedia

### 代码

以一个不知道为什么反正就是叫做`Bag`的东西为例，如果按照与_ADT_相同的思路直接_encode_的话:

_Haskell_

```haskell
data Bag a where
  EmptyBag :: Bag a
  SingletonBag :: a -> Bag a
  StringBag :: [String] -> Bag String
```

_Java_

```java
public abstract class Bag<A> {
    public static <A> Bag<A> emptyBag() {
        return new EmptyBag<>();
    }

    public static <A> Bag<A> singletonBag(A a) {
        return new SingletonBag<>(a);
    }

    public static Bag<String> stringBag(List<String> list) {
        return new StringBag(list);
    }

    public abstract <R> R match(EmptyBag.Case<A, R> caseEmptyBag,
                                SingletonBag.Case<A, R> caseSingletonBag,
                                StringBag.Case<A, R> caseStringBag);

    public static final class EmptyBag<A> extends Bag<A> {
        @Override
        public <R> R match(EmptyBag.Case<A, R> caseEmptyBag,
                           SingletonBag.Case<A, R> caseSingletonBag,
                           StringBag.Case<A, R> caseStringBag) {
            return caseEmptyBag.caseEmptyBag();
        }

        public interface Case<A, R> {
            R caseEmptyBag();
        }
    }

    public static final class SingletonBag<A> extends Bag<A> {
        A a;

        SingletonBag(A a) {
            this.a = a;
        }

        @Override
        public <R> R match(EmptyBag.Case<A, R> caseEmptyBag,
                           SingletonBag.Case<A, R> caseSingletonBag,
                           StringBag.Case<A, R> caseStringBag) {
            return caseSingletonBag.caseSingletonBag(a);
        }

        public interface Case<A, R> {
            R caseSingletonBag(A a);
        }
    }

    public static final class StringBag extends Bag<String> {
        List<String> list;

        StringBag(List<String> list) {
            this.list = list;
        }

        @Override
        public <R> R match(EmptyBag.Case<String, R> caseEmptyBag,
                           SingletonBag.Case<String, R> caseSingletonBag,
                           StringBag.Case<String, R> caseStringBag) {
            return caseStringBag.caseStringBag(list);
        }

        public interface Case<A, R> {
            R caseStringBag(List<String> list);
        }
    }
}
```

测试（将`Bag`变成`Maybe(Optional)`并打印）:

_Haskell_

```haskell
bag1 :: Bag Bool
bag1 = EmptyBag

bag2 :: Bag Float
bag2 = SingletonBag 90.32676

bag3 :: Bag String
bag3 = StringBag ["foo", "bar", "12450"]

toMaybe :: Bag a -> Maybe [a]
toMaybe EmptyBag = Nothing
toMaybe (SingletonBag a) = Nothing
toMaybe (StringBag list) = Just list

main :: IO()
main = do
  putStrLn . show $ toMaybe bag1 -- Nothing
  putStrLn . show $ toMaybe bag2 -- Nothing
  putStrLn . show $ toMaybe bag3 -- Just ["foo","bar","12450"]
```

_Java_

```java
public class BagTest {
    public static void main(String[] args) {
        Bag<?> bag1 = emptyBag();
        Bag<Float> bag2 = singletonBag(90.32676F);
        Bag<String> bag3 = stringBag(List.of("foo", "bar", "12450"));

        System.out.println(bagToMaybe(bag1));
        System.out.println(bagToMaybe(bag2));
        System.out.println(bagToMaybe(bag3));
    }

    public static <A> Optional<List<A>> bagToMaybe(Bag<A> unknownBag) {
        return unknownBag.match(
                /*
                    Required type: Optional <List<A>>
                    Provided: Optional <Object>
                    Incompatible parameter types in lambda expression
                */
                () -> Optional.empty(),
                a -> Optional.empty(),
                (list, id) -> Optional.of(list)
        );
    }
}
```

为了方便解释，所以暂时将`SingletonBag`也_map_到_Nothing_。

就报错了，原因是在这里\***Java\*无法进行`A`与`String`的`equality`推导**。

如果可以证明，那么其实之后就是一个`String`_\->_`A`的过程，将_GADT_又变回了_ADT_。而上文又证明了_ADT_在_Java_中是可以写出来的。

## Identity Type

证明类型的等价性，可以用到\***Identity Type\***

> [identity type -nLab](https://ncatlab.org/nlab/show/identity+type)

一些`Identity Type`工具代码:

_Haskell_

```haskell
data Id a b where
  Refl :: Id a a

refl :: Id a a
refl = Refl

symm :: Id a b -> Id b a
symm Refl = Refl

trans :: Id a b -> Id b c -> Id a c
trans Refl Refl = Refl

cong :: Id a b -> Id (f a) (f b)
cong Refl = Refl

subst :: Id a b -> f a -> f b
subst Refl = id

coerce :: Id a b -> a -> b
coerce Refl = id
```

_Java_

```java
public abstract class Id<A, B> {

    public static <A> Id<A, A> refl() {
        return new Refl<>();
    }

    public abstract Id<B, A> symm();

    public abstract <C> Id<A, C> trans(Id<B, C> id);

    public abstract B coerce(A a);

    public abstract <X, Y> Y subst(X x);

    public abstract <R> R match(Refl.Case<A, B, R> caseRefl);

    public interface Match<A, B, R> extends Refl.Case<A, B, R> { }

    public static final class Refl<A> extends Id<A, A> {

        @Override
        public Id<A, A> symm() {
            return refl();
        }

        @Override
        public <C> Id<A, C> trans(Id<A, C> id) {
            return id;
        }

        @Override
        public A coerce(A a) {
            return a;
        }

        @Override
        public <X, Y> Y subst(X x) {
            return (Y) x;
        }

        public interface Case<A, B, R> {
            R caseRefl();
        }

        @Override
        public <R> R match(Refl.Case<A, A, R> caseRefl) {
            return caseRefl.caseRefl();
        }
    }
}
```

然后利用`Id`来证明`StringBag`与`A`的`equality`，对原有代码进行一些修改，关注`StringBag`相关的部分:

_Haskell_

```haskell
data Bag a where
  EmptyBag :: Bag a
  SingletonBag :: a -> Bag a
  -- StringBag :: [String] -> Bag String
  StringBag :: [String] -> Id String a -> Bag a -- Use Id to infer the equivalence of String and a, return GADT back to ADT

bag3 :: Bag String
-- bag3 = StringBag ["foo", "bar", "12450"]
bag3 = StringBag ["foo", "bar", "12450"] Refl

toMaybe :: Bag a -> Maybe [a]
toMaybe EmptyBag = Nothing
toMaybe (SingletonBag a) = Just [a]
-- toMaybe (StringBag list) = Just list
toMaybe (StringBag list anId) = Just $ subst anId list
```

其实_Haskell_自己是可以推导出`A`与`String`的`equality`的，这段可以不改

_Java_

```java
public abstract class Bag<A> {
    /**
    *Use Id(Identity type) to infer the equivalence of String and a, return GADT back to ADT.
    */
    public static final class StringBag extends Bag<String> {
        @Override
        public <R> R match(EmptyBag.Case<String, R> caseEmptyBag,
                           SingletonBag.Case<String, R> caseSingletonBag,
                           StringBag.Case<String, R> caseStringBag) {
//            return caseStringBag.caseStringBag(list);
            return caseStringBag.caseStringBag(list, refl());
        }

        public interface Case<A, R> {
//            R caseStringBag(List<String> list);
            // use Id(Identity type) to proof equality of A and String
            R caseStringBag(List<String> list, Id<String, A> id);
        }
    }
}
public class BagTest {
    public static <A> Optional<List<A>> bagToMaybe(Bag<A> unknownBag) {
        return unknownBag.match(
                () -> Optional.empty(), // Optional.empty
                a -> Optional.empty(), // Optional.empty
                (list, id) -> Optional.of(id.subst(list)) // Optional[[foo, bar, 12450]]
        );
    }
}
```

这样看上去就成功将_Haskell_的_GADT_给_encode_到了_Java_里，但实际上，_Java_的`Id`中的`Refl.subst(X x) : Y`方法不是绝对安全的，只能开发者自己去保证安全，这是_Java_没有实现的东西（`higher kind`）

[Kind (type theory) -Wikipedia](https://en.wikipedia.org/wiki/Kind_\(type_theory\))

[Lambda cube -Wikipedia](https://en.wikipedia.org/wiki/Lambda_cube)

### 修改SingletonBag

既然知道了解决方案，那么`SingletonBag`也可以进行修改，证明`A`与`A`的等价性:

_Haskell_的代码就不放了，比较简单

_Java_

```java
public static final class SingletonBag<A> extends Bag<A> {
        @Override
        public <R> R match(EmptyBag.Case<A, R> caseEmptyBag,
                           SingletonBag.Case<A, R> caseSingletonBag,
                           StringBag.Case<A, R> caseStringBag) {
            return caseSingletonBag.caseSingletonBag(a, refl());
        }

        public interface Case<A, R> {
            R caseSingletonBag(A a, Id<A, A> id);
        }
    }
public class BagTest {
    public static <A> Optional<List<A>> bagToMaybe(Bag<A> unknownBag) {
        return unknownBag.match(
                () -> Optional.empty(), // Optional.empty
                (a, id) -> Optional.of(id.subst(Collections.singletonList(a))), // Optional[[90.32676]]
                (list, id) -> Optional.of(id.subst(list)) // Optional[[foo, bar, 12450]]
        );
    }
}
```

### 特别感谢

-   雨轩（[github.com/yuxuanchiadm](https://github.com/yuxuanchiadm)）
-   90（[9032676’s Blog | 为探索而生](https://9032676.com/)）

# Kotlineum Roadmap

This document outlines the planned features for the Kotlineum package, bringing Kotlin's powerful patterns and concepts to React applications.

## Current Features

- ✅ **StateFlow**: A state holder observable flow that emits the current and new state updates to its collectors
- ✅ **SharedFlow**: A hot flow that emits values to all collectors
- ✅ **Global Flows**: Application-wide flows accessible from any component

## Upcoming Features

### Phase 1 (Next Release)

- 🏗️ **ViewModels**: MVVM architecture pattern implementation
  - State management with LiveData-like functionality
  - Lifecycle awareness
  - Automatic cleanup
  - Data binding support

### Phase 2

- 🔄 **Coroutines**: Kotlin-inspired asynchronous programming
  - Structured concurrency
  - Cancellation support
  - Context and dispatchers

### Phase 3

- 📦 **Sealed Classes**: Type-safe unions with exhaustive pattern matching
  - Pattern matching utilities
  - Type guards for TypeScript integration

### Phase 4

- 🧩 **Extension Functions**: Extend existing types with new functionality
  - String extensions
  - Array extensions
  - Object extensions

### Phase 5

- 🛡️ **Data Classes**: Immutable data containers with built-in utility functions
  - Automatic equality checks
  - Copy with modifications
  - Destructuring support

### Phase 6

- 🔍 **Scope Functions**: Block-scoped functions like `let`, `run`, `with`, `apply`, and `also`
- 🔒 **Lazy Properties**: Properties that are computed only when accessed
- 🧪 **Result Type**: Type-safe error handling with `Success` and `Failure` wrappers

## Contribution

We welcome contributions! If you're interested in implementing any of these features or have suggestions for additional Kotlin patterns to include, please open an issue or submit a pull request.

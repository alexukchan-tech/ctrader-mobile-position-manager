# cTrader Mobile Position Manager 5.2.1 Symbol Name Fix

Fixes symbol mapping for SDK payloads that use PascalCase fields such as `SymbolId`, `SymbolName`, `Name`, and `Digits`. The previous implementation only read camelCase properties, causing tracked cards to remain labelled `Symbol ID 41`. All live management actions remain locked.

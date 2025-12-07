# KV Notes

## Introduction

KV is a key-value store that allows you to store and retrieve data in a simple and efficient way. It is a great tool for storing small amounts of data, such as user preferences or session data.

## Usage

To use KV, you need to create a KV namespace. This can be done using the `KV.createNamespace` method.

## Create

```zsh
npx wrangler kv namespace create <BINDING_NAME>
npx wrangler kv namespace create DEXP_CONFIG_KV

# a.s. after creation:
# Add the following to your configuration file in your kv_namespaces array:
{
  "kv_namespaces": [
    {
      "binding": "DEXP_CONFIG_KV",
      "id": "80c31c3c68e94886a68b23363738aaeb"
    }
  ]
}
```

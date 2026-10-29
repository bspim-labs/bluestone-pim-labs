---
title: Managing Your Bluestone PIM Data Model with Terraform
date: 2026-10-29
description: The Terraform provider for Bluestone PIM now covers the full data model. Why we built it, what it manages, and how to start using it on an existing organization.
tags: terraform, infrastructure-as-code, data-model, integration
author: Michael van Tellingen
authorUrl: https://www.labdigital.nl
---

At Lab Digital we have been building Terraform providers for SaaS platforms since 2018, starting with [commercetools](https://github.com/labd/terraform-provider-commercetools). The reason has always been the same: the configuration of a platform belongs in version control, next to the code that depends on it. Bluestone PIM is no different, so we built a [Terraform provider for Bluestone PIM](https://github.com/labd/terraform-provider-bluestonepim) as well.

The first version appeared in 2024 and covered the basics: attribute definitions, categories, category attributes, contexts and webhooks. With version 1.0 the provider now covers the full data model, so you can manage everything you would otherwise configure by hand in the Bluestone PIM settings.

## Why Terraform for a PIM?

Most Bluestone PIM implementations have more than one organization: a test environment, an acceptance environment and production. The data model has to be the same in all of them. Your integrations, your import jobs and your storefront all depend on attribute numbers, select values and category structures being exactly where they expect them.

Keeping that in sync by hand works fine for the first month. After that someone adds an attribute in production and forgets test, or a select value gets a slightly different number in acceptance, and an import breaks in a way that takes a day to track down.

With Terraform the data model is described in code. A change goes through a pull request, somebody reviews it, and `terraform apply` rolls out the exact same change to every environment. You also get an audit trail for free: Git tells you who added that attribute, when, and why.

## What it looks like

Below is a small example. It creates a Dutch context, an attribute group with two attributes, a category and a mandatory category attribute.

```hcl
terraform {
  required_providers {
    bluestonepim = {
      source  = "labd/bluestonepim"
      version = "~> 1.0"
    }
  }
}

# Credentials are read from BP_CLIENT_ID and BP_CLIENT_SECRET
provider "bluestonepim" {}

resource "bluestonepim_context" "nl" {
  name        = "Dutch"
  locale      = "nl-NL"
  fallback_id = "en"
}

resource "bluestonepim_attribute_group" "frame" {
  name   = "Frame"
  number = "frame"
}

resource "bluestonepim_attribute_definition" "frame_size" {
  name      = "Frame size"
  number    = "frame-size"
  data_type = "single_select"
  group_id  = bluestonepim_attribute_group.frame.id

  restrictions = {
    enum = {
      type = "text"
      values = [
        { value = "S", number = "s" },
        { value = "M", number = "m" },
        { value = "L", number = "l" },
      ]
    }
  }
}

resource "bluestonepim_attribute_definition" "frame_material" {
  name      = "Frame material"
  number    = "frame-material"
  data_type = "text"
  group_id  = bluestonepim_attribute_group.frame.id
}

resource "bluestonepim_attribute_definition_context" "frame_material_nl" {
  definition_id = bluestonepim_attribute_definition.frame_material.id
  context_id    = bluestonepim_context.nl.id
  name          = "Framemateriaal"
}

resource "bluestonepim_category" "bikes" {
  name = "Bikes"
}

resource "bluestonepim_category_attribute" "bikes_frame_size" {
  category_id             = bluestonepim_category.bikes.id
  attribute_definition_id = bluestonepim_attribute_definition.frame_size.id
  mandatory               = true
  propagate               = true
}
```

Run `terraform plan` and Terraform shows you what it is going to create. Run `terraform apply` and it is there. Point the same configuration at another organization by switching the credentials, and you get the same data model there.

The nice part is that references between resources are explicit. Terraform knows the category attribute depends on the category and the attribute definition, so it creates them in the right order, and it uses the IDs Bluestone generates without you having to copy them around.

## Connecting Bluestone PIM to the rest of your stack

That last point gets more interesting once other services are involved. A PIM rarely lives on its own: product data has to go to a commerce platform, a search index or a storefront, and webhooks are usually how that starts.

In the example below we configure a webhook that calls an AWS Lambda function every time a product sync is done. Bluestone PIM signs every webhook message with a secret, so we generate that secret in Terraform and store it in AWS SSM, where the Lambda function can read it to verify the `x-bs-signature` header.

```hcl
resource "random_password" "webhook_secret" {
  length  = 32
  special = false
}

resource "aws_ssm_parameter" "webhook_secret" {
  name  = "/pim-sync/webhook-secret"
  type  = "SecureString"
  value = random_password.webhook_secret.result
}

# The pim-sync function itself is omitted for readability
resource "aws_lambda_function_url" "pim_sync" {
  function_name      = "pim-sync"
  authorization_type = "NONE"
}

resource "bluestonepim_webhook" "pim_sync" {
  url    = aws_lambda_function_url.pim_sync.function_url
  secret = random_password.webhook_secret.result
  active = true
  event_types = [
    "PRODUCT_SYNC_DONE",
  ]
}
```

One `terraform apply` sets up both sides and connects them. Rotating the secret is a matter of replacing `random_password`, and Terraform updates the webhook and the SSM parameter in the same run. The same works with Azure Functions, Google Cloud or any other service that has a Terraform provider, which is pretty much all of them.

## What the provider manages

The provider uses the Bluestone PIM Management API (MAPI) and covers:

- Attribute definitions of all types, including select values, restrictions and units, plus dedicated resources for column, matrix, dictionary and compound attributes
- Dictionary values
- Attribute groups, and the order of groups and of the definitions within a group
- Categories and category level attributes, including value, `mandatory`, `propagate` and `locked`
- Contexts with their fallback, and the names and descriptions of attributes, groups and categories per context
- Product relation types
- Webhooks

It does not manage products. Product data is content, maintained by the people working in the PIM every day. The data model those products live in is configuration, and that is where Terraform is a good fit.

## Being careful with a live data model

A PIM data model is not like a load balancer you can throw away and recreate. Delete an attribute definition and the values on every product go with it. We spent a good part of the 1.0 work on making sure the provider does not do anything destructive by accident:

- Changing the `data_type` of an attribute is rejected at plan time. Normally Terraform would replace the resource, which in Bluestone PIM means removing the attribute and all its values. If you really want that, you use `terraform apply -replace` deliberately.
- The same goes for `context_aware`: it can't be changed on an existing definition, so the provider tells you during the plan instead of failing halfway through an apply.
- Select values keep their `value_id` when you add, remove or reorder them. Values are matched on their ID or number, never on the label.
- A relation type that is still used by product connections is only deleted when you set `force_destroy = true`.
- Restrictions and content types are validated against the data type during `terraform plan`, so you find mistakes before anything is sent to Bluestone PIM.

Large configurations also run into the API rate limit at some point. The provider retries rate limited requests with backoff, so large plans don't fail halfway through.

## Starting from an existing organization

Very few teams start with an empty PIM. Usually there is a data model already, built up over months or years in the UI. You don't have to recreate that: every resource in the provider supports import. With an `import` block you tell Terraform which existing object belongs to which resource:

```hcl
import {
  to = bluestonepim_attribute_definition.frame_size
  id = "<attribute definition id>"
}
```

Running `terraform plan -generate-config-out=generated.tf` writes a first version of the configuration for you. That is a good start, but you still have to find the IDs of everything you want to import, and the generated code contains those IDs hardcoded instead of references between resources.

This is where an AI coding assistant like Claude Code helps a lot. Give it the MAPI credentials of the organization and ask it to bring the existing data model under Terraform:

```text
Using the bluestonepim Terraform provider, import the existing data model of this
organization: contexts, attribute groups, attribute definitions, categories and
category attributes. Write import blocks and the matching resources, use references
instead of hardcoded IDs, and run terraform plan until it shows no changes.
```

Claude reads the data model through the API, writes the import blocks and the resources, and keeps running `terraform plan` to compare its code with what is actually in Bluestone PIM. When the plan shows no changes, the code describes your organization exactly. This works for a test environment, but just as well for a production organization that has been running for years.

We used to need a tool like Terraformer for this kind of reverse engineering, and then only for the platforms it supported. With import blocks and an assistant that can read an API and write HCL, you can do it for any Terraform provider, Bluestone PIM included.

Importing doesn't change anything in Bluestone PIM, but the first `terraform apply` after it will if the code doesn't match. So make sure the plan is clean before you apply anything, especially on production. From there you commit the code, and from that moment on changes go through pull requests. You can do this gradually, starting with the part of the data model your integrations depend on most.

## Getting started

You need a MAPI client ID and secret for your organization. Set them as environment variables:

```sh
export BP_CLIENT_ID=...
export BP_CLIENT_SECRET=...
```

Then add the provider to your configuration as shown above and run `terraform init`. The [documentation on the Terraform registry](https://registry.terraform.io/providers/labd/bluestonepim/latest/docs) has an example for every resource.

The provider is open source and built on our [Go SDK for Bluestone PIM](https://github.com/labd/bluestonepim-go-sdk). If you run into a bug or miss something, open an issue or a pull request on [GitHub](https://github.com/labd/terraform-provider-bluestonepim). And if you want help setting it up in your organization, you can reach us at opensource@labdigital.nl.

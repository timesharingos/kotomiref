[![Test and Build](https://github.com/timesharingos/kotomiref/actions/workflows/testandbuild.yml/badge.svg)](https://github.com/timesharingos/kotomiref/actions/workflows/testandbuild.yml)

# Welcome to Kotomiref
## What's this?
It is a entity-oriented, semantic, and lightweight literature management system, which helps users to discover the evolvement of a method, the aspects of a problem, and the solutions to a specific scenario.

This project originates from my urgent requirements of managing literatures when researching. The literatures relate to each other through reference, but the research objects connot be revealed by only the references. I have tried other products, such as famous Endnote, Obsidian, or online database, but none of them is suitable for me. So, this project is developed, aiming to the first-class entities, light-weight, and inferential capability. Tailoring the SGP framework, the project extends the traditional "tag-based" literature into "semantic-tag-based" literature. The primary objective of this project is to re-construct the keypoint of the literatures, so that 90% of queries can be resolved without referring back to the original literature after a one-time ingestion process.

## Related products
- Endnote
- Obsidian
- AMiner(which is the most similar)

# Quick Start

## Step1: Add domain
1. Switch to *Entity*, select *Domain*.
2. Adding *Domain* and *Subdomain*.

Note: The main domain is used to describe the category, such as NLP、CV and so on. The subdomain is used to describe a specific interest, such as LLM、compiler security, and so on.

## Step2: Define the problem
1. Select *Tech Entity*, check the *Problem* or *Scenario*.
2. Adding proper entities.

Note: The problem is used to describe a *chanllege*, and the scenario is used to describe an *aspect*.

## Step3: Add proper entity
check other items in the *Tech entity*, and add proper entity.

- Reseach Object: the "primitive" of a research, such as a data structure, a model layer, and so on.
- Algorithm: As the name suggests, transform the input into the output.
- Improvement: As the name suggests, improve an object and advance.
- Contribution: A complete summary of a design, including proposing objects, algorithms, or improvments. A contribution is the solution to a scenario.

## Step5: Add signatures
Switch to the *Signature*, and add proper authors and corresponding affiliations.

## Step6: Add article
Switch to the *Article*, follow the wizard to adding articles.

## Step7: Exploring the entities.

> Prelude: Make sure you have added enough articles, so that at least one improvement is present.

1. Switch to the *Search*, select the *Entity Improvement Path*.
2. Select one entity to search.
3. The improvement path of this entity is present.
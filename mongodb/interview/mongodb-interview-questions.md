# MongoDB Interview Questions

This document contains a list of MongoDB interview questions ranging from junior to senior levels.

## Junior Developer Questions

1.  **What is MongoDB?**

    - MongoDB is a source-available cross-platform document-oriented database program. Classified as a NoSQL database program, MongoDB uses JSON-like documents with optional schemas.

2.  **What is a document in MongoDB?**

    - A document in MongoDB is a set of key-value pairs. Documents have a dynamic schema, meaning that documents in the same collection do not need to have the same set of fields or structure.

3.  **What is a collection in MongoDB?**

    - A collection is a group of MongoDB documents. It is the equivalent of a table in a relational database.

4.  **What is the difference between SQL and NoSQL databases?**

    - **SQL databases** are relational, use structured data, and have a predefined schema.
    - **NoSQL databases** are non-relational, can have unstructured or semi-structured data, and have a dynamic schema.

5.  **What is `_id` in a MongoDB document?**

    - The `_id` field is a required, unique identifier for each document in a collection. If you don't provide an `_id`, MongoDB automatically generates an `ObjectId` for it.

6.  **How do you insert a document into a collection?**

    - Using `insertOne()` to insert a single document, or `insertMany()` to insert multiple documents.

7.  **How do you query for documents?**
    - Using the `find()` method. For example, `db.collection.find({ name: "John" })`.

## Mid-level Developer Questions

1.  **What is indexing in MongoDB?**

    - Indexing is a way to improve the performance of queries. An index stores a small portion of the collection's data in an easy-to-traverse form. MongoDB supports various types of indexes, such as single field, compound, and multikey.

2.  **What is a compound index?**

    - A compound index is an index on multiple fields. The order of fields in a compound index matters.

3.  **What is aggregation in MongoDB?**

    - The aggregation framework is a set of tools for processing a large number of documents in a collection by passing them through a pipeline of stages. The pipeline can filter, group, and transform documents.

4.  **Explain the aggregation pipeline.**

    - The aggregation pipeline is a series of stages, where each stage transforms the documents as they pass through it. Common stages include `$match`, `$group`, `$sort`, `$project`, and `$lookup`.

5.  **What is the difference between embedding and referencing?**

    - **Embedding (Denormalization)**: Including related data in a single document. This is good for read performance as it avoids joins.
    - **Referencing (Normalization)**: Storing related data in separate documents and referencing them using their `_id`. This is good when you have large, complex relationships or when data is frequently updated.

6.  **What is sharding?**
    - Sharding is the process of distributing data across multiple machines. MongoDB uses sharding to support deployments with very large data sets and high throughput operations.

## Senior Developer Questions

1.  **What is a replica set?**

    - A replica set is a group of `mongod` processes that maintain the same data set. Replica sets provide redundancy and high availability. One member is the primary, which receives all write operations. The other members are secondaries, which replicate the primary's data.

2.  **Explain the write concern in MongoDB.**

    - Write concern describes the level of acknowledgment requested from MongoDB for write operations. A higher write concern provides stronger data durability guarantees but can increase latency.

3.  **What are the different storage engines in MongoDB?**

    - MongoDB supports multiple storage engines. The default and most common is **WiredTiger**. There is also an **In-Memory** storage engine for specialized use cases.

4.  **How does indexing affect write performance?**

    - While indexes improve read performance, they can negatively impact write performance. For every `insert`, `update`, or `delete` operation, MongoDB must also update all indexes on the collection. The more indexes you have, the more overhead there is for writes.

5.  **What is a covered query?**

    - A covered query is a query that can be satisfied entirely using an index, without having to examine any documents. This is very efficient. For a query to be covered, all the fields in the query must be part of an index, and all the fields returned in the results must be in the same index.

6.  **How would you handle schema design for a high-traffic application?**

    - Discuss data modeling patterns in MongoDB, such as the schema versioning pattern, the attribute pattern, and the bucket pattern. The choice of pattern depends on the application's access patterns.

7.  **What are some strategies for optimizing MongoDB performance?**
    - Discuss index optimization (e.g., creating appropriate indexes, using covered queries), schema design, sharding strategy, hardware considerations, and using the aggregation framework effectively. Also, mention using tools like `explain()` to analyze query performance.

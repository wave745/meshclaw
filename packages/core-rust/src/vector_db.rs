use lancedb::{connect, Table, Connection, query::*};
use arrow_array::{RecordBatch, Float32Array, StringArray, FixedSizeListArray, Array, RecordBatchIterator};
use arrow_schema::{DataType, Field, Schema};
use futures::stream::StreamExt;
use std::sync::Arc;

pub struct VectorDb {
    table: Table,
}

impl VectorDb {
    pub async fn new() -> Self {
        let db: Connection = connect("./.meshclaw/lancedb").execute().await.unwrap();
        
        let schema = Arc::new(Schema::new(vec![
            Field::new("id", DataType::Utf8, false),
            Field::new(
                "embedding", 
                DataType::FixedSizeList(Arc::new(Field::new("item", DataType::Float32, true)), 384), 
                true
            ),
            Field::new("metadata", DataType::Utf8, true),
        ]));
        
        let table = match db.open_table("shared_vectors").execute().await {
            Ok(t) => t,
            Err(_) => {
                let initial_batch = RecordBatch::new_empty(schema.clone());
                let batches = RecordBatchIterator::new(vec![Ok(initial_batch)], schema.clone());
                db.create_table("shared_vectors", batches)
                    .execute()
                    .await
                    .expect("Failed to create table")
            }
        };
        
        VectorDb { table }
    }

    pub async fn add(&self, id: &str, embedding: Vec<f32>, metadata: &str) {
        let schema = self.table.schema().await.unwrap();
        
        let values = Arc::new(Float32Array::from(embedding)) as Arc<dyn Array>;
        let field = Arc::new(Field::new("item", DataType::Float32, true));
        let embedding_array = FixedSizeListArray::try_new(field, 384, values, None).unwrap();

        let batch = RecordBatch::try_new(
            schema.clone(),
            vec![
                Arc::new(StringArray::from(vec![id])),
                Arc::new(embedding_array),
                Arc::new(StringArray::from(vec![metadata])),
            ],
        ).unwrap();
        
        let batches = RecordBatchIterator::new(vec![Ok(batch)], schema);
        self.table.add(batches).execute().await.unwrap();
    }

    #[allow(dead_code)]
    pub async fn search(&self, query_vec: Vec<f32>, limit: usize) -> Vec<(String, f32)> {
        let mut stream = self.table
            .query()
            .nearest_to(query_vec)
            .unwrap()
            .limit(limit)
            .execute()
            .await
            .expect("Failed to execute search query");
        
        let mut out = Vec::new();
        while let Some(batch_result) = stream.next().await {
            let batch: RecordBatch = batch_result.expect("Failed to get next batch from stream");
            
            let ids_array = batch.column_by_name("id")
                .expect("id column missing");
            let ids = ids_array.as_any().downcast_ref::<StringArray>()
                .expect("id column not a StringArray");
            
            let dists_array = batch.column_by_name("_distance")
                .expect("_distance column missing");
            let distances = dists_array.as_any().downcast_ref::<Float32Array>()
                .expect("_distance column not a Float32Array");
            
            for i in 0..batch.num_rows() {
                out.push((ids.value(i).to_string(), distances.value(i)));
            }
        }
        out
    }
}

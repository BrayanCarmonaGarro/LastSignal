# app/services/rag_service.py
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import PGVector
from app.core.config import settings

embeddings = GoogleGenerativeAIEmbeddings(
    model="gemini-embedding-2-preview", 
    google_api_key=settings.ai_api_key
)

CONNECTION_STRING = settings.database_url.replace("postgresql://", "postgresql+psycopg2://")

def get_similar_entries(query_text: str, k: int = 3):
    """
    Busca registros similares basados en la descripción técnica.
    """

    vector_store = PGVector(
        connection_string=CONNECTION_STRING,
        embedding_function=embeddings,
        collection_name="logbook_embeddings",
    )
    
    docs = vector_store.similarity_search(query_text, k=k)
    return [doc.page_content for doc in docs]

def index_new_entry(text: str, metadata: dict):
    """
    Guarda el vector del nuevo registro para futuras búsquedas.
    """
    vector_store = PGVector(
        connection_string=CONNECTION_STRING,
        embedding_function=embeddings,
        collection_name="logbook_embeddings",
    )
    vector_store.add_texts(texts=[text], metadatas=[metadata])
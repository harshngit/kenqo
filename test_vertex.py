import vertexai
from vertexai.generative_models import GenerativeModel
from vertexai.language_models import TextEmbeddingModel

vertexai.init(project="ultra-welder-492207-r5", location="us-central1")

def test_gemini():
    model = GenerativeModel("gemini-2.5-flash")
    response = model.generate_content("Say hello in one sentence.")
    print("✅ Gemini:", response.text)

def test_embeddings():
    model = TextEmbeddingModel.from_pretrained("text-embedding-005")
    embeddings = model.get_embeddings(["Medicare lymphedema compression garment coverage criteria"])
    print(f"✅ Embeddings: {len(embeddings[0].values)} dimensions")

test_gemini()
test_embeddings()
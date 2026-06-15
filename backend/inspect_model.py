"""Inspect the .keras model to understand its architecture."""
import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

import tensorflow as tf

model_path = os.path.join("app", "services", "models", "model.keras")
print(f"Loading model from: {model_path}")
model = tf.keras.models.load_model(model_path)

print("\n=== MODEL SUMMARY ===")
model.summary()

print("\n=== MODEL CONFIG (first 5 layers) ===")
config = model.get_config()
for i, layer in enumerate(config["layers"][:10]):
    print(f"\nLayer {i}: {layer['class_name']} -> name={layer['config'].get('name', 'N/A')}")
    if layer['class_name'] in ('Normalization', 'Rescaling'):
        print(f"  Config: {layer['config']}")

print("\n=== INPUT/OUTPUT SHAPES ===")
print(f"Input shape: {model.input_shape}")
print(f"Output shape: {model.output_shape}")

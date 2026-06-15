"""
Load model.weights.h5 by manually extracting weights and matching by shape.
The h5 file has generic layer names while current Keras 3 uses descriptive names.
"""
import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

import h5py
import numpy as np
import tensorflow as tf

weights_path = os.path.join("app", "services", "models", "model.weights.h5")

# Step 1: Extract ALL weight arrays from h5 (excluding optimizer)
print("=== EXTRACTING H5 WEIGHTS ===")
h5_weights = []
with h5py.File(weights_path, 'r') as f:
    def collect(name, obj):
        if isinstance(obj, h5py.Dataset) and not name.startswith('optimizer'):
            h5_weights.append((name, np.array(obj)))
    f.visititems(collect)

print(f"Total h5 weight arrays: {len(h5_weights)}")
for path, arr in h5_weights[:10]:
    print(f"  {path}: {arr.shape}")
print("  ...")

# Step 2: Build model
print("\n=== BUILDING MODEL ===")
base_model = tf.keras.applications.EfficientNetB0(
    include_top=False,
    weights=None,
    input_shape=(224, 224, 3),
)
x = tf.keras.layers.GlobalAveragePooling2D()(base_model.output)
x = tf.keras.layers.Dropout(0.5)(x)
outputs = tf.keras.layers.Dense(38, activation='softmax')(x)
model = tf.keras.Model(base_model.input, outputs)

model_weights = model.weights
print(f"Total model weight variables: {len(model_weights)}")
for w in model_weights[:10]:
    print(f"  {w.name}: {w.shape}")
print("  ...")

# Step 3: Try shape-based matching
# Group h5 weights by shape
print("\n=== SHAPE ANALYSIS ===")
h5_shapes = {}
for path, arr in h5_weights:
    s = tuple(arr.shape)
    if s not in h5_shapes:
        h5_shapes[s] = []
    h5_shapes[s].append((path, arr))

model_shapes = {}
for w in model_weights:
    s = tuple(w.shape)
    if s not in model_shapes:
        model_shapes[s] = []
    model_shapes[s].append(w)

print(f"Unique shapes in h5: {len(h5_shapes)}")
print(f"Unique shapes in model: {len(model_shapes)}")

# Check if all shapes from model exist in h5 with same count
all_match = True
for shape, model_vars in model_shapes.items():
    h5_count = len(h5_shapes.get(shape, []))
    if h5_count != len(model_vars):
        print(f"  Shape {shape}: model={len(model_vars)}, h5={h5_count}")
        all_match = False

if all_match:
    print("All shapes have matching counts!")
else:
    print("Shape count mismatches found!")

# Step 4: Try ordering-based assignment
# The key insight: within each layer type, the creation order is the same.
# Let's extract from h5 in a specific layer-by-layer order
print("\n=== ATTEMPTING ORDERED LOADING ===")

# Get the functional sub-model layer order from h5
with h5py.File(weights_path, 'r') as f:
    # Get all layers with weights in the functional sub-model
    func_layers_path = 'layers/functional/layers'
    func_layers = f[func_layers_path]
    
    # For each layer, check if it has vars
    layers_with_weights = []
    for lname in sorted(func_layers.keys()):
        vars_group = func_layers[lname].get('vars')
        if vars_group and len(vars_group) > 0:
            weight_arrays = []
            for vkey in sorted(vars_group.keys(), key=int):
                weight_arrays.append(np.array(vars_group[vkey]))
            layers_with_weights.append((lname, weight_arrays))
    
    # Add top-level layers (dense)
    top_layers = f['layers']
    for lname in sorted(top_layers.keys()):
        if lname == 'functional':
            continue
        vars_group = top_layers[lname].get('vars')
        if vars_group and len(vars_group) > 0:
            weight_arrays = []
            for vkey in sorted(vars_group.keys(), key=int):
                weight_arrays.append(np.array(vars_group[vkey]))
            layers_with_weights.append((lname, weight_arrays))

print(f"Layers with weights from h5: {len(layers_with_weights)}")
for lname, arrs in layers_with_weights:
    shapes_str = ", ".join(str(a.shape) for a in arrs)
    print(f"  {lname}: [{shapes_str}]")

# Get model layers with weights
print(f"\nModel layers with weights:")
model_layers_with_weights = []
for layer in model.layers:
    ws = layer.get_weights()
    if len(ws) > 0:
        model_layers_with_weights.append((layer.name, ws))
        shapes_str = ", ".join(str(w.shape) for w in ws)
        print(f"  {layer.name}: [{shapes_str}]")

print(f"\nH5 layers with weights: {len(layers_with_weights)}")
print(f"Model layers with weights: {len(model_layers_with_weights)}")

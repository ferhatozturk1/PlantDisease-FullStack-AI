"""Deep inspect the .weights.h5 to understand the exact architecture."""
import h5py
import os

weights_path = os.path.join("app", "services", "models", "model.weights.h5")

with h5py.File(weights_path, 'r') as f:
    # Check the functional sub-model layers for key layers
    print("=== FUNCTIONAL SUB-MODEL KEY LAYERS ===")
    func_layers = f['layers/functional/layers']
    all_layer_names = sorted(list(func_layers.keys()))
    
    # Show all layer names
    print(f"Total layers in functional: {len(all_layer_names)}")
    
    # Find interesting layers (normalization, rescaling, pooling, input, dense)
    for name in all_layer_names:
        if any(kw in name for kw in ['normalization', 'rescaling', 'pooling', 'input', 'dense', 'rescal']):
            layer = func_layers[name]
            vars_group = layer.get('vars', None)
            if vars_group and len(vars_group.keys()) > 0:
                print(f"  {name}: vars={list(vars_group.keys())}")
                for v in vars_group.keys():
                    ds = vars_group[v]
                    print(f"    {v}: shape={ds.shape}, dtype={ds.dtype}")
            else:
                print(f"  {name}: (no vars)")
    
    print("\n=== TOP-LEVEL LAYERS ===")
    top_layers = f['layers']
    for name in sorted(top_layers.keys()):
        layer = top_layers[name]
        if name == 'functional':
            print(f"  {name}: (sub-model, {len(all_layer_names)} layers)")
            continue
        vars_group = layer.get('vars', None)
        if vars_group and len(vars_group.keys()) > 0:
            print(f"  {name}: vars={list(vars_group.keys())}")
            for v in vars_group.keys():
                ds = vars_group[v]
                print(f"    {v}: shape={ds.shape}, dtype={ds.dtype}")
        else:
            print(f"  {name}: (no vars)")
    
    print("\n=== OPTIMIZER INFO ===")
    if 'optimizer' in f:
        opt = f['optimizer']
        print(f"  Keys: {list(opt.keys())}")
        if 'vars' in opt:
            opt_vars = opt['vars']
            print(f"  Optimizer vars count: {len(opt_vars.keys())}")
            # Show first few
            for i, v in enumerate(sorted(opt_vars.keys())[:5]):
                ds = opt_vars[v]
                print(f"    {v}: shape={ds.shape}")
    
    # Check for BatchNorm in functional to see structure
    print("\n=== FIRST FEW CONV/BN LAYERS ===")
    for name in all_layer_names[:20]:
        layer = func_layers[name]
        vars_group = layer.get('vars', None)
        if vars_group and len(vars_group.keys()) > 0:
            shapes = []
            for v in sorted(vars_group.keys()):
                shapes.append(f"{v}:{vars_group[v].shape}")
            print(f"  {name}: {', '.join(shapes)}")

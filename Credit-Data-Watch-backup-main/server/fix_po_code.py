import os

app_dir = os.path.join(os.path.dirname(__file__), "app")
fixed_files = []

for root, _, files in os.walk(app_dir):
    for file in files:
        if file.endswith(".py"):
            filepath = os.path.join(root, file)
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            
            # Look for PurchaseOrder instantiation with gstin=
            if "PurchaseOrder(" in content and "gstin=" in content:
                # Replace gstin= with vendor_gstin=
                new_content = content.replace("gstin=", "vendor_gstin=")
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(new_content)
                fixed_files.append(filepath)

print("\n" + "="*50)
if fixed_files:
    for ff in fixed_files:
        print(f"✅ Automatically fixed PO creation in: {ff}")
else:
    print("ℹ️ No manual file changes needed or already updated.")
print("="*50)
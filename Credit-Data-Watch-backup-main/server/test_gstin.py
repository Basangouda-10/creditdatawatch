import sys
sys.path.insert(0, '.')
from app.utils.gstin import is_valid_gstin

print('Testing GSTIN validation:')
print(f'22AAAAACOCOALZ5: {is_valid_gstin("22AAAAACOCOALZ5")}')
print(f'22AAAAA0000A1Z5: {is_valid_gstin("22AAAAA0000A1Z5")}')

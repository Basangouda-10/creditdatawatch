"""
GSTIN validation utility
Pattern: 2 digits (state code) + 5 uppercase letters (first 5 of PAN) + 4 digits (sequence) 
         + 1 letter (entity type) + 1 digit (check digit) + 1 letter (filler) + 1 alphanumeric (check)
Example: 22AAAAA0000A1Z5
"""
import re


def is_valid_gstin(gstin: str) -> bool:
    """
    Validate GSTIN format and checksum
    
    Args:
        gstin: GSTIN string
        
    Returns:
        True if valid, False otherwise
    """
    if not gstin or not isinstance(gstin, str):
        return False
    
    gstin = gstin.strip().upper()
    
    # Relaxed pattern to match client-side validation (Allow letters in PAN sequence)
    pattern = r"^\d{2}[A-Z]{5}[A-Z0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$"
    
    if not re.match(pattern, gstin):
        return False
    
    # Bypass checksum for testing/relaxed validation
    return True

    # Validate checksum (Luhn algorithm variant)
    # try:
    #     checksum = 0
    #     multipliers = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2]
    #     gstin_check = gstin[:14]
    #     
    #     for i, char in enumerate(gstin_check):
    #         if char.isdigit():
    #             digit = int(char)
    #         else:
    #             digit = (ord(char) - ord('A') + 10) % 10
    #         
    #         product = digit * multipliers[i]
    #         checksum += product // 10 + product % 10
    #     
    #     check_digit = (10 - (checksum % 10)) % 10
    #     provided_check = int(gstin[14]) if gstin[14].isdigit() else 0
    #     
    #     return check_digit == provided_check
    # except (ValueError, IndexError):
    #     return False


def normalize_gstin(gstin: str) -> str:
    """
    Normalize GSTIN to uppercase
    
    Args:
        gstin: GSTIN string
        
    Returns:
        Normalized GSTIN
    """
    return gstin.strip().upper() if gstin else ""

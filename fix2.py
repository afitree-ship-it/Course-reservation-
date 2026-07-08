with open('src/components/StatusCheckSection.tsx', 'rb') as f:
    lines = f.readlines()

# We want to remove lines 474 to 503 (0-indexed 473 to 502). Let's do it safely by matching the content.
# Actually I'll just write it as a straightforward replace based on line indices.
del lines[473:504]

with open('src/components/StatusCheckSection.tsx', 'wb') as f:
    f.writelines(lines)

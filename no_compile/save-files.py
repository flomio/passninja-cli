import os

with open('pn.js', 'r') as bundled: 
    for line in bundled:
        if (line[0:8] == '/***/ \".'):
            filename = line[9:-3]
            if filename[0] == "/":
                filename = filename[1:]
        if line.startswith('eval("'):
            code = line[6:-3]
            os.makedirs(os.path.dirname(filename), exist_ok=True)
            with open(filename, 'w') as new:
                new.write(code.replace('\\n', '\n'))

import os
import re

dashboard_path = r'c:\Users\Daniel Idonor\Suler EMS\src\app\(dashboard)'

for root, dirs, files in os.walk(dashboard_path):
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content.replace('font-black', 'font-bold')
            new_content = new_content.replace('rounded-3xl', 'rounded-[24px]')
            # 2xl is usually 16px, xl is 12px.
            # But let's check if there are rounded-[32px] or similar
            new_content = re.sub(r'rounded-\[32px\]', 'rounded-[24px]', new_content)
            
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {path}")

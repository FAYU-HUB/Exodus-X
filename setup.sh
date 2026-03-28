#!/data/data/com.termux/files/usr/bin/bash

echo "Menyiapkan Exodus-X Client..."
pkg update && pkg upgrade -y
pkg install nodejs -y

# Install dependensi node
npm install mineflayer mineflayer-autoeat mineflayer-armor-manager vec3

# Membuat perintah global di Termux
echo "Mendaftarkan perintah 'exodus'..."
echo "#!/data/data/com.termux/files/usr/bin/bash" > $PREFIX/bin/exodus
echo "cd $(pwd) && node index.js" >> $PREFIX/bin/exodus
chmod +x $PREFIX/bin/exodus

echo "=========================================="
echo " INSTALASI SELESAI! "
echo " Sekarang kamu bisa mengetik 'exodus' "
echo " dari mana saja di Termux. "
echo "=========================================="


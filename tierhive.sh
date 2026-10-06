#!/bin/sh

# Panggil enviroment var
. ./hv.env


echo "Mengirim data ke TierHive"
echo "-------------------------"
echo ""
lftp -p $PORT -u "$USERNAME," $SERVER <<EOF
set sftp:connect-program "ssh -a -x -i /Users/kusaeni/.ssh/id_ed25519.pub -p $PORT"
mirror -R --verbose --only-newer _site/ /$ROOTPATH
bye
EOF

if [ $? -eq 0 ]; then
	echo "Done!" 1>&2
else
	echo "Ada ava kadavra?" 1>&2
	exit 1
fi


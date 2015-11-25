#!/usr/bin/env bash

TEST_PATH=$(pwd)
yes | rm -r temp || true
mkdir temp
mkdir temp/repositories
mkdir -p temp/student1/submissions/turned_on_a_computer.git/hooks
mkdir -p temp/student2/submissions/used_a_computer.git/hooks
mkdir -p temp/student_usable/submissions/test_submission.git/hooks
TEMP_PATH=$(readlink -f temp/)
REPO_PATH=$(readlink -f temp/repositories)
rmdir temp/repositories

TESTSERVERPID=$(cat frontend_staging_pid) || true
kill $TESTSERVERPID


rm bogus_key_*
rm **/bogus_key_*

# pull the latest from the backend
cd gitsubmit-backend
git checkout master
git pull

# in case they weren't stopped last time
docker stop gitotestname_front || true
docker rm -v gitotestname_front || true
docker stop mongotestname_front || true
docker rm -v mongotestname_front || true

set -e # exit with non-zero exit codes immediately
if [ "$local_instance" = "yes" ]; then
    # this is not on a server
    . ~/gitsubmitenv/bin/activate
else
    # This is probably being run locally by shawkins
    . /virtualenvs/gitsubmit_env/bin/activate
fi
pip install -r requirements.txt

# Start up a docker instance for the gitolite repo
# -v $(readlink -f gitolite.rc):/home/git/.gitolite.rc
nohup docker run --name gitotestname_front -p 3023:22 -e SSH_KEY="$(cat /home/git/.ssh/id_rsa.pub)" elsdoerfer/gitolite &
nohup docker run --name mongotestname_front -p 27217:27017 -e AUTH=no tutum/mongodb &


sleep 10 # let docker warm up

# copy our gitolite.rc over to the docker machine -- enables forking
echo "==============================================================="
echo "ll"
ls -la
echo "docker cp ci/gitolite.rc gitotestname:/home/git/.gitolite.rc"
docker cp ci/gitolite.rc gitotestname_front:/home/git/.gitolite.rc
echo "==============================================================="

# Get a copy of the faked gitolite repo
# note: see ~git/.ssh/config for info on this; contents below
# Host gitolite_test_git
# StrictHostKeyChecking no
# User git
# Hostname api.gitsubmit.com
# Port 3022

cd $TEMP_PATH
git clone gitolite_test_git_front:gitolite-admin
GL_PATH=$(readlink -f gitolite-admin/)

# do the setup we need for pyolite to work
cd $GL_PATH
echo 'include     "repos/**/**/*.conf"' >> conf/gitolite.conf
echo 'include     "repos/**/*.conf"' >> conf/gitolite.conf
echo 'include     "repos/*.conf"' >> conf/gitolite.conf
git add conf
git commit -m "initial setup for pyolite"
git push


# get back to where we were
cd $TEST_PATH/gitsubmit-backend
cd src
# shove some data in there
python ../ci/fill_db_with_fake_data.py -p 27217 -pyo $GL_PATH

# start a testing server on port 5555
nohup /virtualenvs/gitsubmit_env/bin/gunicorn --access-logfile /srv/logs/staging_access.log -w 1 -b :5559 "app:configured_main('$GL_PATH', '$REPO_PATH', 27217)" &

NEWTESTSERVERPID=$!
echo $NEWTESTSERVERPID > $TEST_PATH/staging_pid
sleep 3 # let gunicorn warm up

cd $TEST_PATH

echo "API_SERVER=\"http://localhost:5559\"" > assets/js/config.js
python -m SimpleHTTPServer 5558

cd test
# Run tests with an X virtual frame buffer
export PYTHONPATH=$(readlink -f libraries):$(readlink -f resources):$PYTHONPATH
xvfb-run --server-args="-screen 0, 1920x1080x24" python -m robot.run --noncritical not_implemented --variable TEMP_PATH:$TEMP_PATH .
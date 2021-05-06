# TODO run & test
echo "Hyperflow environmental variables:" ;
env | grep "HF_" ;
while ! [ -f /work_dir/workflow.json ]; do echo "Waiting for workflow.json to be mounted..." ; done ;
echo "Workflow data mounted: " ; ls -la /work_dir ;
mkdir -p /work_dir/logs-hf ;
echo "Running workflow:" ;
cd /work_dir ;
hflow run workflow.json ;
if [ "$(ls -A /work_dir/logs-hf)" ]; then
  echo 1 > /work_dir/postprocStart ;
else
  echo "Hyperflow logs not collected. Something must have gone wrong!"
fi ;
  echo "Workflow finished. Container is waiting for manual termination." ;
  while true; do sleep 5 ; done ;
else
  while true; do sleep 5 ; done ;
fi ;
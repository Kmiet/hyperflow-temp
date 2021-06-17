# TODO
# Just: npm install plugin & run script
# kubectl exec -it hyperflow-engine-59dd974fd8-drzmz -c hyperflow sh
ENGINE_POD_NAME=hyperflow-engine-59dd974fd8-drzmz

# SoyKB
# kubectl cp ./soykbData/workflow.config.jobAgglomerations.json $ENGINE_POD_NAME:/work_dir/workflow.config.jobAgglomerations.json &&
# kubectl cp ./soykbData/start-script.sh $ENGINE_POD_NAME:/start-script.sh &&
# kubectl cp ./soykbData/cleanup.sh $ENGINE_POD_NAME:/cleanup.sh &&
# kubectl cp ./soykbData/execTimes.dat $ENGINE_POD_NAME:/work_dir/execTimes.dat &&
# kubectl cp ./soykbData/cpuMap.dat $ENGINE_POD_NAME:/work_dir/cpuMap.dat &&

# Montage
kubectl cp ./montageData/start-script.sh $ENGINE_POD_NAME:/start-script.sh &&
kubectl cp ./montageData/cleanup.sh $ENGINE_POD_NAME:/cleanup.sh &&
kubectl cp ./montageData/workflow-025.config.jobAgglomerations.json $ENGINE_POD_NAME:/work_dir/workflow.config.jobAgglomerations.json &&
# kubectl cp ./montageData/workflow.config.jobAgglomerations.json $ENGINE_POD_NAME:/work_dir/workflow.config.jobAgglomerations.json &&
kubectl cp ./montageData/execTimes.dat $ENGINE_POD_NAME:/work_dir/execTimes.dat &&
kubectl cp ./montageData/cpuMap.dat $ENGINE_POD_NAME:/work_dir/cpuMap.dat &&

kubectl cp ./hyperflow/hyperflow-dag-scheduler-plugin $ENGINE_POD_NAME:/dag-scheduler &&

# Bez aglo + empty
# kubectl cp ./hyperflow/functions/kubernetes/k8sCommand.js $ENGINE_POD_NAME:/hyperflow/functions/kubernetes/k8sCommand.js &&
# kubectl cp ./hyperflow/functions/kubernetes/k8sJobSubmit.js $ENGINE_POD_NAME:/hyperflow/functions/kubernetes/k8sJobSubmit.js

# Z aglo
kubectl cp ./hyperflow/functions/kubernetes/k8sCommand_aglo.js $ENGINE_POD_NAME:/hyperflow/functions/kubernetes/k8sCommand.js &&
kubectl cp ./hyperflow/functions/kubernetes/k8sJobSubmit_aglo.js $ENGINE_POD_NAME:/hyperflow/functions/kubernetes/k8sJobSubmit.js
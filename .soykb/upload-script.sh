# TODO

kubectl cp execTimes.dat hyperflow-engine-6b465cf4cd-2pwgd:/work_dir/execTimes.dat
kubectl cp cpuMap.dat hyperflow-engine-6b465cf4cd-2pwgd:/work_dir/cpuMap.dat 

kubectl cp . hyperflow-engine-6b465cf4cd-2pwgd:/heft-scheduler

kubectl cp k8sCommand.js hyperflow-engine-6b465cf4cd-2pwgd:/hyperflow/functions/kubernetes/k8sCommand.js
kubectl cp k8sJobSubmit.js hyperflow-engine-6b465cf4cd-2pwgd:/hyperflow/functions/kubernetes/k8sJobSubmit.js
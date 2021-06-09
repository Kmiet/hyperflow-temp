ENGINE_POD_NAME=hyperflow-engine-5f46bdfd8c-tprw2
WF_ID=1
EXP_NAME=experiment-$WF_ID

# kubectl cp $ENGINE_POD_NAME:/work_dir/parsed ./soykbData/$EXP_NAME &&
# kubectl cp $ENGINE_POD_NAME:/work_dir/scheduler_task_data_$WF_ID.experiment ./soykbData/$EXP_NAME/scheduler_task_data_$WF_ID.experiment

kubectl cp $ENGINE_POD_NAME:/work_dir/parsed ./montageData/$EXP_NAME &&
kubectl cp $ENGINE_POD_NAME:/work_dir/scheduler_task_data_$WF_ID.experiment ./montageData/$EXP_NAME/scheduler_task_data_$WF_ID.experiment
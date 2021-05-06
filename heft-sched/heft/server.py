from flask import Flask, request
from heft import heft
import sys
import csv
import numpy as np
app = Flask(__name__)

def write_files(payload):
    cpuMatrix = payload['cpuMatrix']
    dagMatrix = payload['dagMatrix']
    timeMatrix = payload['timeMatrix']

    with open('execTimes.csv', 'w') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerows(timeMatrix)

    with open('dag.csv', 'w') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerows(dagMatrix)

    with open('resources.csv', 'w') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerows(cpuMatrix)




@app.route('/', methods=['POST'])
def schedule_dag():
    payload = request.get_json()
    write_files(payload)
    comp_matrix_1 = heft.readCsvToNumpyMatrix('./execTimes.csv')
    comm_matrix_1 = heft.readCsvToNumpyMatrix('./resources.csv')
    dag1 = heft.readDagMatrix('./dag.csv')
    startup_vector_1 = np.array([ 0 for _ in range(comm_matrix_1.shape[0]) ])

    sched, _, _ = heft.schedule_dag(dag1, communication_matrix=comm_matrix_1, computation_matrix=comp_matrix_1, communication_startup=startup_vector_1)
    return {
        "sched": sched,
    }

# from heft import heft, gantt
# import networkx as nx
# import os
# os.environ["PATH"] += os.pathsep + 'C:/Program Files/Graphviz/bin/'

if __name__ == "__main__":
    app.run(host='0.0.0.0')

# comp_matrix_2 = heft.readCsvToNumpyMatrix('./test/randomgraph_task_exe_time.csv')
# comm_matrix_2 = heft.readCsvToNumpyMatrix('./test/randomgraph_resource_BW.csv')
# dag2 = heft.readDagMatrix('./test/randomgraph_task_connectivity.csv', show_dag=True)
# # dag2 = heft.readDagMatrix('./test/randomgraph_task_connectivity.csv')

# sched, _, _ = heft.schedule_dag(dag2, communication_matrix=comm_matrix_2, computation_matrix=comp_matrix_2)

# print(sched)

# print(comm_matrix_2, comp_matrix_2)

# dag1 = heft.readDagMatrix('./test/canonicalgraph_task_connectivity.csv', show_dag=True)
#     print("HI", file=sys.stderr)
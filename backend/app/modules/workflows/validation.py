NODE_TYPES = {"trigger", "agent", "tool", "condition", "output", "delay", "approval"}


def validate_graph(nodes, edges):
    if not nodes or len(nodes) > 100:
        raise ValueError("A workflow needs between 1 and 100 nodes")
    ids = [n["id"] for n in nodes]
    if len(set(ids)) != len(ids):
        raise ValueError("Node identifiers must be unique")
    triggers = [n for n in nodes if n["data"]["kind"] == "trigger"]
    if len(triggers) != 1:
        raise ValueError("Exactly one trigger is required")
    if not any(n["data"]["kind"] == "output" for n in nodes):
        raise ValueError("At least one output is required")
    incoming = {i: 0 for i in ids}
    children = {i: [] for i in ids}
    for node in nodes:
        if node["data"]["kind"] not in NODE_TYPES:
            raise ValueError("Unknown node type")
    kinds = {node["id"]: node["data"]["kind"] for node in nodes}
    edge_ids = [edge["id"] for edge in edges if "id" in edge]
    if len(edge_ids) != len(set(edge_ids)):
        raise ValueError("Connection identifiers must be unique")
    for edge in edges:
        if edge["source"] not in incoming or edge["target"] not in incoming:
            raise ValueError("Connection references a missing node")
        if kinds[edge["source"]] == "output":
            raise ValueError("Output nodes cannot have outgoing connections")
        if kinds[edge["target"]] == "trigger":
            raise ValueError("Trigger nodes cannot have incoming connections")
        handle = edge.get("sourceHandle")
        if handle and (kinds[edge["source"]] != "condition" or handle not in ("true", "false")):
            raise ValueError("Branch handles must be true or false on a condition node")
        incoming[edge["target"]] += 1
        children[edge["source"]].append(edge["target"])
    queue = [i for i in ids if incoming[i] == 0]
    if queue != [triggers[0]["id"]]:
        raise ValueError("Every node must connect to the trigger")
    order = []
    while queue:
        identifier = queue.pop(0)
        order.append(identifier)
        for target in children[identifier]:
            incoming[target] -= 1
            if incoming[target] == 0:
                queue.append(target)
    if len(order) != len(nodes):
        raise ValueError("Cycles are not supported")
    return order

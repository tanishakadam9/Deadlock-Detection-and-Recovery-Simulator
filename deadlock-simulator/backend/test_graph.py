import pytest
from core.graph import ResourceAllocationGraph
from app import app, db
from models import Process, ResourceType, Allocation, Request

def test_single_instance_deadlock_cycle():
    rag = ResourceAllocationGraph()
    rag.add_process('P1')
    rag.add_process('P2')
    rag.add_resource_type('R1', instances=1)
    rag.add_resource_type('R2', instances=1)

    rag.add_allocation('P1', 'R1', amount=1)
    rag.add_allocation('P2', 'R2', amount=1)
    rag.add_request('P1', 'R2', amount=1)
    rag.add_request('P2', 'R1', amount=1)

    cycle_res = rag.detect_cycle()
    assert cycle_res['has_cycle'] is True
    assert set(cycle_res['deadlocked_processes']) == {'P1', 'P2'}

    res = rag.detect_deadlock()
    assert res['deadlock'] is True
    assert set(res['deadlocked_processes']) == {'P1', 'P2'}
    assert res['is_single_instance'] is True

def test_single_instance_no_deadlock():
    rag = ResourceAllocationGraph()
    rag.add_process('P1')
    rag.add_process('P2')
    rag.add_resource_type('R1', instances=1)
    rag.add_resource_type('R2', instances=1)

    rag.add_allocation('P1', 'R1', amount=1)
    rag.add_allocation('P2', 'R2', amount=1)
    rag.add_request('P1', 'R2', amount=1)

    cycle_res = rag.detect_cycle()
    assert cycle_res['has_cycle'] is False
    assert cycle_res['deadlocked_processes'] == []

    res = rag.detect_deadlock()
    assert res['deadlock'] is False
    assert res['deadlocked_processes'] == []

def test_multi_instance_cycle_without_deadlock():
    rag = ResourceAllocationGraph()
    for p in ['P1', 'P2', 'P3', 'P4']:
        rag.add_process(p)
    rag.add_resource_type('R1', instances=2)
    rag.add_resource_type('R2', instances=2)

    rag.add_allocation('P1', 'R1', amount=1)
    rag.add_allocation('P3', 'R1', amount=1)
    rag.add_allocation('P2', 'R2', amount=1)
    rag.add_allocation('P4', 'R2', amount=1)

    rag.add_request('P1', 'R2', amount=1)
    rag.add_request('P2', 'R1', amount=1)

    multi_res = rag.detect_deadlock_multi_instance()
    assert multi_res['deadlock'] is False
    assert multi_res['deadlocked_processes'] == []

def test_multi_instance_deadlock():
    rag = ResourceAllocationGraph()
    rag.add_process('P1')
    rag.add_process('P2')
    rag.add_resource_type('R1', instances=2)
    rag.add_resource_type('R2', instances=2)

    rag.add_allocation('P1', 'R1', amount=1)
    rag.add_allocation('P1', 'R2', amount=1)
    rag.add_allocation('P2', 'R1', amount=1)
    rag.add_allocation('P2', 'R2', amount=1)

    rag.add_request('P1', 'R1', amount=1)
    rag.add_request('P2', 'R2', amount=1)

    multi_res = rag.detect_deadlock_multi_instance()
    assert multi_res['deadlock'] is True
    assert set(multi_res['deadlocked_processes']) == {'P1', 'P2'}

    res = rag.detect_deadlock()
    assert res['deadlock'] is True
    assert set(res['deadlocked_processes']) == {'P1', 'P2'}

def test_cytoscape_serialization():
    rag = ResourceAllocationGraph()
    rag.add_process('P1', priority='High')
    rag.add_resource_type('R1', instances=3)
    rag.add_allocation('P1', 'R1', amount=2)
    rag.add_request('P1', 'R1', amount=1)

    cyto = rag.to_cytoscape_elements()
    assert 'nodes' in cyto
    assert 'edges' in cyto
    assert len(cyto['nodes']) == 2
    assert len(cyto['edges']) == 2

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.app_context():
        # Clean existing test data from tables
        Allocation.query.delete()
        Request.query.delete()
        Process.query.delete()
        ResourceType.query.delete()
        db.session.commit()
        yield app.test_client()
        Allocation.query.delete()
        Request.query.delete()
        Process.query.delete()
        ResourceType.query.delete()
        db.session.commit()

def test_api_routes(client):
    r_proc = client.post('/api/process', json={'name': 'ProcA', 'priority': 'High'})
    assert r_proc.status_code == 201

    r_res = client.post('/api/resource', json={'name': 'ResA', 'instances': 2})
    assert r_res.status_code == 201

    r_alloc = client.post('/api/allocate', json={'process': 'ProcA', 'resource': 'ResA', 'amount': 1})
    assert r_alloc.status_code == 201

    r_req = client.post('/api/request', json={'process': 'ProcA', 'resource': 'ResA', 'amount': 1})
    assert r_req.status_code == 201

    r_rag = client.get('/api/rag')
    assert r_rag.status_code == 200
    rag_data = r_rag.get_json()
    assert len(rag_data['nodes']) == 2
    assert len(rag_data['edges']) == 2

    r_detect = client.get('/api/detect')
    assert r_detect.status_code == 200
    detect_data = r_detect.get_json()
    assert 'deadlock' in detect_data
    assert 'deadlocked_processes' in detect_data


# ---------------------------------------------------------------------------
# build_rag() classmethod + detect_cycle_rag() tests
# ---------------------------------------------------------------------------

def test_rag_three_process_cycle():
    """
    Classic 3-process / 3-resource single-instance deadlock.

    Allocations:  R1->P1,  R2->P2,  R3->P3
    Requests:     P1->R2,  P2->R3,  P3->R1

    RAG cycle path (alternating):  R1 -> P1 -> R2 -> P2 -> R3 -> P3 -> (R1)
    WFG cycle (process-only):      P1 -> P2 -> P3 -> (P1)
    """
    rag = ResourceAllocationGraph.build_rag(
        processes=['P1', 'P2', 'P3'],
        resources=['R1', 'R2', 'R3'],
        allocations=[('R1', 'P1'), ('R2', 'P2'), ('R3', 'P3')],
        requests=[('P1', 'R2'), ('P2', 'R3'), ('P3', 'R1')],
    )

    # --- WFG-based cycle detection (existing method) ---
    cycle_res = rag.detect_cycle()
    assert cycle_res['has_cycle'] is True, "WFG should detect a cycle"
    assert set(cycle_res['deadlocked_processes']) == {'P1', 'P2', 'P3'}, \
        "All three processes must be deadlocked"

    # --- RAG-level cycle detection (includes resource nodes) ---
    rag_cycle_res = rag.detect_cycle_rag()
    assert rag_cycle_res['has_cycle'] is True, "RAG itself must contain a cycle"
    assert len(rag_cycle_res['cycles']) >= 1, "At least one RAG cycle must be found"

    # The RAG cycle must include all 6 nodes (3 processes + 3 resources)
    all_cycle_nodes = {node for cycle in rag_cycle_res['cycles'] for node in cycle}
    assert all_cycle_nodes >= {'P1', 'P2', 'P3', 'R1', 'R2', 'R3'}, (
        f"RAG cycle should include all 6 nodes, got: {all_cycle_nodes}"
    )

    # Verify alternating edge types in the cycle path
    # Each consecutive pair must alternate: process->resource (request)
    # or resource->process (allocation)
    for cycle in rag_cycle_res['cycles']:
        if set(cycle) >= {'P1', 'P2', 'P3', 'R1', 'R2', 'R3'}:
            # Walk the cycle (wrap around) and confirm alternating types
            n = len(cycle)
            for i in range(n):
                src = cycle[i]
                tgt = cycle[(i + 1) % n]
                edge_data = rag.graph.get_edge_data(src, tgt)
                assert edge_data is not None, f"Edge {src}->{tgt} missing in RAG"
                etype = edge_data.get('edge_type')
                if src in rag.processes_info:
                    assert etype == 'request', \
                        f"Process->Resource edge {src}->{tgt} should be 'request', got '{etype}'"
                else:
                    assert etype == 'allocation', \
                        f"Resource->Process edge {src}->{tgt} should be 'allocation', got '{etype}'"
            break  # Only check the first full cycle

    # Sanity: unified detect_deadlock also flags it
    unified = rag.detect_deadlock()
    assert unified['deadlock'] is True
    assert set(unified['deadlocked_processes']) == {'P1', 'P2', 'P3'}


def test_rag_no_cycle_p3_requests_r2():
    """
    Negative test: P3 holds R3 but makes NO request, so the circular wait
    P1->P2->P3->P1 is broken. No deadlock should be detected.

    Allocations:  R1->P1,  R2->P2,  R3->P3
    Requests:     P1->R2,  P2->R3   (P3 requests nothing)

    WFG:  P1 -> P2 -> P3    (linear chain, no cycle)
    """
    rag = ResourceAllocationGraph.build_rag(
        processes=['P1', 'P2', 'P3'],
        resources=['R1', 'R2', 'R3'],
        allocations=[('R1', 'P1'), ('R2', 'P2'), ('R3', 'P3')],
        requests=[('P1', 'R2'), ('P2', 'R3')],   # P3 makes no request
    )

    cycle_res = rag.detect_cycle()
    assert cycle_res['has_cycle'] is False, \
        "No WFG cycle should exist when P3 holds R3 and makes no request"
    assert cycle_res['deadlocked_processes'] == []

    rag_cycle_res = rag.detect_cycle_rag()
    assert rag_cycle_res['has_cycle'] is False, \
        "No RAG cycle should exist when P3 holds R3 and makes no request"


# ---------------------------------------------------------------------------
# Specific single-instance deadlock detection tests
# ---------------------------------------------------------------------------

def test_single_instance_two_process_deadlock():
    """
    R1->P1, R2->P2, P1->R2, P2->R1 (all single-instance) -> deadlock=True, cycle [P1, P2].
    """
    rag = ResourceAllocationGraph()
    rag.add_process('P1')
    rag.add_process('P2')
    rag.add_resource_type('R1', instances=1)
    rag.add_resource_type('R2', instances=1)

    rag.add_allocation('P1', 'R1', amount=1)
    rag.add_allocation('P2', 'R2', amount=1)
    rag.add_request('P1', 'R2', amount=1)
    rag.add_request('P2', 'R1', amount=1)

    res = rag.detect_deadlock()
    assert res['deadlock'] is True
    assert res['is_single_instance'] is True
    assert set(res['deadlocked_processes']) == {'P1', 'P2'}

    single_res = rag.detect_single_instance_deadlock()
    assert single_res['deadlock'] is True
    assert any(set(c) == {'P1', 'P2'} for c in single_res['cycles'])


def test_single_instance_wait_edge_no_deadlock():
    """
    R1->P1, P2->R1 (single-instance) -> deadlock=False.
    Specifically assert this is NOT flagged true just because a wait edge exists
    (guard against the 'every wait = deadlock' bug).
    """
    rag = ResourceAllocationGraph()
    rag.add_process('P1')
    rag.add_process('P2')
    rag.add_resource_type('R1', instances=1)

    rag.add_allocation('P1', 'R1', amount=1)
    rag.add_request('P2', 'R1', amount=1)

    wfg = rag.build_wait_for_graph()
    # Confirm that a wait-for edge exists: P2 is waiting for P1
    assert wfg.has_edge('P2', 'P1'), "P2 should have a directed wait edge to P1"
    assert len(list(wfg.edges())) == 1, "Exactly one wait edge should exist in WFG"

    # Crucial assertion: despite the wait edge existing, deadlock MUST be False
    single_res = rag.detect_single_instance_deadlock()
    assert single_res['deadlock'] is False, "A linear wait (P2 -> P1) must NOT be flagged as deadlock"
    assert single_res['cycles'] == []
    assert single_res['deadlocked_processes'] == []

    res = rag.detect_deadlock()
    assert res['deadlock'] is False, "detect_deadlock must return False when no cycle exists"
    assert res['deadlocked_processes'] == []


def test_single_instance_three_process_deadlock_cycle():
    """
    A 3-process cycle P1->P2->P3->P1 -> deadlock=True with all three processes listed.
    """
    rag = ResourceAllocationGraph()
    for p in ['P1', 'P2', 'P3']:
        rag.add_process(p)
    for r in ['R1', 'R2', 'R3']:
        rag.add_resource_type(r, instances=1)

    rag.add_allocation('P1', 'R1', amount=1)
    rag.add_allocation('P2', 'R2', amount=1)
    rag.add_allocation('P3', 'R3', amount=1)

    rag.add_request('P1', 'R2', amount=1)
    rag.add_request('P2', 'R3', amount=1)
    rag.add_request('P3', 'R1', amount=1)

    res = rag.detect_deadlock()
    assert res['deadlock'] is True
    assert res['is_single_instance'] is True
    assert set(res['deadlocked_processes']) == {'P1', 'P2', 'P3'}

    single_res = rag.detect_single_instance_deadlock()
    assert single_res['deadlock'] is True
    assert any(set(c) == {'P1', 'P2', 'P3'} for c in single_res['cycles'])


# ---------------------------------------------------------------------------
# Section 18 Critical Test Cases (Single-Instance Resource Model)
# ---------------------------------------------------------------------------

def test_section_18_scenario_1():
    """
    TEST 1:
    R1 -> P1, R2 -> P2, P3 -> R1, P3 -> R2
    Expected:
      WFG edges: P3 -> P1, P3 -> P2
      Deadlock: False
      Cycles: none
    """
    rag = ResourceAllocationGraph()
    for p in ['P1', 'P2', 'P3']:
        rag.add_process(p)
    for r in ['R1', 'R2']:
        rag.add_resource_type(r, instances=1)

    rag.add_allocation('P1', 'R1', amount=1)
    rag.add_allocation('P2', 'R2', amount=1)
    rag.add_request('P3', 'R1', amount=1)
    rag.add_request('P3', 'R2', amount=1)

    wfg = rag.build_wait_for_graph()
    wfg_edges = set(wfg.edges())
    assert wfg_edges == {('P3', 'P1'), ('P3', 'P2')}, f"Expected only {{('P3', 'P1'), ('P3', 'P2')}}, got {wfg_edges}"
    assert ('P1', 'P2') not in wfg_edges and ('P2', 'P1') not in wfg_edges

    res = rag.detect_single_instance_deadlock()
    assert res['deadlock'] is False
    assert res['has_cycle'] is False
    assert res['cycles'] == []
    assert res['deadlocked_processes'] == []


def test_section_18_scenario_2():
    """
    TEST 2:
    R1 -> P1, R2 -> P2, P1 -> R2, P2 -> R1
    Expected:
      WFG edges: P1 -> P2, P2 -> P1
      Deadlock: True
      Cycle: P1 -> P2 -> P1
      Deadlocked processes: P1, P2
    """
    rag = ResourceAllocationGraph()
    for p in ['P1', 'P2']:
        rag.add_process(p)
    for r in ['R1', 'R2']:
        rag.add_resource_type(r, instances=1)

    rag.add_allocation('P1', 'R1', amount=1)
    rag.add_allocation('P2', 'R2', amount=1)
    rag.add_request('P1', 'R2', amount=1)
    rag.add_request('P2', 'R1', amount=1)

    wfg = rag.build_wait_for_graph()
    wfg_edges = set(wfg.edges())
    assert wfg_edges == {('P1', 'P2'), ('P2', 'P1')}

    res = rag.detect_single_instance_deadlock()
    assert res['deadlock'] is True
    assert res['has_cycle'] is True
    assert set(res['deadlocked_processes']) == {'P1', 'P2'}


def test_section_18_scenario_3():
    """
    TEST 3:
    R1 -> P1, R2 -> P2, P3 -> R1
    Expected:
      WFG edges: P3 -> P1
      Deadlock: False
      Cycles: none
    """
    rag = ResourceAllocationGraph()
    for p in ['P1', 'P2', 'P3']:
        rag.add_process(p)
    for r in ['R1', 'R2']:
        rag.add_resource_type(r, instances=1)

    rag.add_allocation('P1', 'R1', amount=1)
    rag.add_allocation('P2', 'R2', amount=1)
    rag.add_request('P3', 'R1', amount=1)

    wfg = rag.build_wait_for_graph()
    wfg_edges = set(wfg.edges())
    assert wfg_edges == {('P3', 'P1')}

    res = rag.detect_single_instance_deadlock()
    assert res['deadlock'] is False
    assert res['deadlocked_processes'] == []


def test_section_18_scenario_4():
    """
    TEST 4:
    R1 -> P1, P2 -> R1, R2 -> P2, P3 -> R2
    Expected:
      WFG edges: P2 -> P1, P3 -> P2
      Deadlock: False
      Cycles: none (chain P3 -> P2 -> P1 is waiting, not deadlock)
    """
    rag = ResourceAllocationGraph()
    for p in ['P1', 'P2', 'P3']:
        rag.add_process(p)
    for r in ['R1', 'R2']:
        rag.add_resource_type(r, instances=1)

    rag.add_allocation('P1', 'R1', amount=1)
    rag.add_request('P2', 'R1', amount=1)
    rag.add_allocation('P2', 'R2', amount=1)
    rag.add_request('P3', 'R2', amount=1)

    wfg = rag.build_wait_for_graph()
    wfg_edges = set(wfg.edges())
    assert wfg_edges == {('P2', 'P1'), ('P3', 'P2')}

    res = rag.detect_single_instance_deadlock()
    assert res['deadlock'] is False
    assert res['deadlocked_processes'] == []


def test_section_18_scenario_5():
    """
    TEST 5:
    R1 -> P1, P2 -> R1, R2 -> P2, P1 -> R2, R3 -> P3, P4 -> R3
    Expected:
      WFG edges: P2 -> P1, P1 -> P2, P4 -> P3
      Deadlock: True
      Deadlocked processes: P1, P2
      Critical rule: P4 and P3 are NOT deadlocked and must NOT be in deadlocked_processes!
    """
    rag = ResourceAllocationGraph()
    for p in ['P1', 'P2', 'P3', 'P4']:
        rag.add_process(p)
    for r in ['R1', 'R2', 'R3']:
        rag.add_resource_type(r, instances=1)

    rag.add_allocation('P1', 'R1', amount=1)
    rag.add_request('P2', 'R1', amount=1)
    rag.add_allocation('P2', 'R2', amount=1)
    rag.add_request('P1', 'R2', amount=1)
    rag.add_allocation('P3', 'R3', amount=1)
    rag.add_request('P4', 'R3', amount=1)

    wfg = rag.build_wait_for_graph()
    wfg_edges = set(wfg.edges())
    assert wfg_edges == {('P2', 'P1'), ('P1', 'P2'), ('P4', 'P3')}

    res = rag.detect_single_instance_deadlock()
    assert res['deadlock'] is True
    assert set(res['deadlocked_processes']) == {'P1', 'P2'}, (
        f"Only cycle processes P1 and P2 should be deadlocked, got: {res['deadlocked_processes']}"
    )
    assert 'P3' not in res['deadlocked_processes']
    assert 'P4' not in res['deadlocked_processes']



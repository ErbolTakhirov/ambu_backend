
def calculate_route(start_coords, end_coords):
    """
    Placeholder for Person 3's routing logic.
    Returns a tuple of (shortest_path, optimized_path).
    Each path is a list of [lat, lon] lists.
    """
    # Mock data for demonstration
    # In reality, this would call the actual routing algorithm
    
    # Simple straight line + some noise for "shortest"
    shortest_path = [
        start_coords,
        [(start_coords[0] + end_coords[0]) / 2, (start_coords[1] + end_coords[1]) / 2],
        end_coords
    ]
    
    # Slightly different path for "optimized"
    optimized_path = [
        start_coords,
        [start_coords[0] + 0.001, start_coords[1] + 0.001],
        [(start_coords[0] + end_coords[0]) / 2 + 0.002, (start_coords[1] + end_coords[1]) / 2 + 0.002],
        end_coords
    ]
    
    return shortest_path, optimized_path

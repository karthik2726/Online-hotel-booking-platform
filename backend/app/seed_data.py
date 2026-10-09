"""Seed data generator for Hotel Booking Platform demonstration."""
from datetime import date, timedelta, datetime
from sqlalchemy.orm import Session
from .database import Base, engine
from .models.domain import UserModel, HotelModel, RoomModel, BookingModel, PaymentModel
from .models.enums import BookingStatus, PaymentStatus, RoomType


def seed_database_tables(db: Session, target_engine=None) -> dict:
    """
    Clears existing records and repopulates with realistic demo dataset.
    """
    eng = target_engine or db.get_bind()
    # Drop and recreate tables to ensure pristine schema state
    Base.metadata.drop_all(bind=eng)
    Base.metadata.create_all(bind=eng)

    # 1. Seed Users
    users = [
        UserModel(
            user_id="usr_arun_101",
            name="Arun Kumar",
            email="arun.kumar@example.com",
            created_at=datetime.utcnow() - timedelta(days=30),
        ),
        UserModel(
            user_id="usr_priya_102",
            name="Priya Sharma",
            email="priya.sharma@example.com",
            created_at=datetime.utcnow() - timedelta(days=20),
        ),
        UserModel(
            user_id="usr_karthik_103",
            name="Karthik Subramanian",
            email="karthik.s@example.com",
            created_at=datetime.utcnow() - timedelta(days=15),
        ),
        UserModel(
            user_id="usr_ananya_104",
            name="Ananya Iyer",
            email="ananya.iyer@example.com",
            created_at=datetime.utcnow() - timedelta(days=10),
        ),
    ]
    for u in users:
        db.add(u)
    db.flush()

    # 2. Seed Hotels (at least 5 hotels across Coimbatore, Bengaluru, Chennai, etc.)
    hotels = [
        HotelModel(
            hotel_id="htl_cbe_residency",
            name="The Residency Towers",
            city="Coimbatore",
            address="1076, Avinashi Road, Race Course, Coimbatore, Tamil Nadu 641018",
            rating=4.8,
            description="Luxury 5-star hotel in the heart of Coimbatore featuring world-class dining, rooftop swimming pool, and spa amenities.",
            amenities="High-Speed Wi-Fi, Rooftop Pool, Fitness Center, 24/7 Room Service, Complimentary Buffet Breakfast, Valet Parking"
        ),
        HotelModel(
            hotel_id="htl_cbe_lemeridien",
            name="Le Meridien Coimbatore",
            city="Coimbatore",
            address="762, Avinashi Road, Neelambur, Coimbatore, Tamil Nadu 641062",
            rating=4.7,
            description="Contemporary hotel with upscale design, expansive banquet halls, and international culinary experiences near airport.",
            amenities="High-Speed Wi-Fi, Swimming Pool, Multi-Cuisine Restaurants, Airport Shuttle, Spa & Wellness, Business Lounge"
        ),
        HotelModel(
            hotel_id="htl_blr_tajwestend",
            name="Taj West End Bengaluru",
            city="Bengaluru",
            address="25, Race Course Road, High Grounds, Bengaluru, Karnataka 560001",
            rating=4.9,
            description="Heritage luxury nestled amid 20 acres of flora, blending colonial elegance with modern state-of-the-art tech.",
            amenities="Lush Gardens, Jiva Spa, Tennis Courts, Outdoor Pool, Award-Winning Dining, Concierge Services"
        ),
        HotelModel(
            hotel_id="htl_chn_itc_grandchola",
            name="ITC Grand Chola",
            city="Chennai",
            address="63, Mount Road, Guindy, Chennai, Tamil Nadu 600032",
            rating=4.9,
            description="A tribute to Southern Indian architectural grandeur with palatial courtyards and world-class luxury hospitality.",
            amenities="10 Award-Winning Restaurants, 3 Swimming Pools, Royal Spa, Executive Club, EV Charging, Helipad"
        ),
        HotelModel(
            hotel_id="htl_cbe_alofthotel",
            name="Aloft Coimbatore",
            city="Coimbatore",
            address="483, Kamaraj Road, Uppilipalayam, Singanallur, Coimbatore 641005",
            rating=4.5,
            description="Vibrant, tech-forward boutique hotel catering to modern corporate travelers and vacationers.",
            amenities="Free Wi-Fi, Re:fuel Grab & Go, W XYZ Bar, Splash Pool, Gym, Meeting Rooms"
        ),
        HotelModel(
            hotel_id="htl_mum_trident",
            name="Trident Nariman Point",
            city="Mumbai",
            address="CR 2, Nariman Point, Marine Drive, Mumbai, Maharashtra 400021",
            rating=4.8,
            description="Iconic waterfront hotel overlooking the Arabian Sea and the glittering Queen's Necklace.",
            amenities="Ocean Views, 24-Hour Business Center, Sunset Bar, Wellness Spa, Luxury Chauffeur"
        ),
    ]
    for h in hotels:
        db.add(h)
    db.flush()

    # 3. Seed Rooms (at least 3 rooms per hotel)
    rooms = [
        # The Residency Towers Coimbatore
        RoomModel(room_id="rm_res_101", hotel_id="htl_cbe_residency", room_number="101", room_type=RoomType.STANDARD.value, price_per_night=3500.0, capacity=2),
        RoomModel(room_id="rm_res_102", hotel_id="htl_cbe_residency", room_number="102", room_type=RoomType.DELUXE.value, price_per_night=5200.0, capacity=3),
        RoomModel(room_id="rm_res_103", hotel_id="htl_cbe_residency", room_number="201", room_type=RoomType.EXECUTIVE_SUITE.value, price_per_night=8500.0, capacity=4),
        RoomModel(room_id="rm_res_104", hotel_id="htl_cbe_residency", room_number="301", room_type=RoomType.PRESIDENTIAL.value, price_per_night=15000.0, capacity=5),

        # Le Meridien Coimbatore
        RoomModel(room_id="rm_lem_101", hotel_id="htl_cbe_lemeridien", room_number="401", room_type=RoomType.STANDARD.value, price_per_night=4200.0, capacity=2),
        RoomModel(room_id="rm_lem_102", hotel_id="htl_cbe_lemeridien", room_number="402", room_type=RoomType.DELUXE.value, price_per_night=6000.0, capacity=3),
        RoomModel(room_id="rm_lem_103", hotel_id="htl_cbe_lemeridien", room_number="501", room_type=RoomType.EXECUTIVE_SUITE.value, price_per_night=9800.0, capacity=4),

        # Taj West End Bengaluru
        RoomModel(room_id="rm_taj_101", hotel_id="htl_blr_tajwestend", room_number="Garden-12", room_type=RoomType.DELUXE.value, price_per_night=11000.0, capacity=2),
        RoomModel(room_id="rm_taj_102", hotel_id="htl_blr_tajwestend", room_number="Garden-14", room_type=RoomType.EXECUTIVE_SUITE.value, price_per_night=18000.0, capacity=3),
        RoomModel(room_id="rm_taj_103", hotel_id="htl_blr_tajwestend", room_number="Heritage-01", room_type=RoomType.PRESIDENTIAL.value, price_per_night=32000.0, capacity=4),

        # ITC Grand Chola Chennai
        RoomModel(room_id="rm_itc_101", hotel_id="htl_chn_itc_grandchola", room_number="Chola-204", room_type=RoomType.STANDARD.value, price_per_night=7500.0, capacity=2),
        RoomModel(room_id="rm_itc_102", hotel_id="htl_chn_itc_grandchola", room_number="Chola-305", room_type=RoomType.DELUXE.value, price_per_night=10500.0, capacity=3),
        RoomModel(room_id="rm_itc_103", hotel_id="htl_chn_itc_grandchola", room_number="Chola-501", room_type=RoomType.EXECUTIVE_SUITE.value, price_per_night=16500.0, capacity=4),

        # Aloft Coimbatore
        RoomModel(room_id="rm_alo_101", hotel_id="htl_cbe_alofthotel", room_number="A-201", room_type=RoomType.STANDARD.value, price_per_night=3200.0, capacity=2),
        RoomModel(room_id="rm_alo_102", hotel_id="htl_cbe_alofthotel", room_number="A-202", room_type=RoomType.DELUXE.value, price_per_night=4800.0, capacity=3),
        RoomModel(room_id="rm_alo_103", hotel_id="htl_cbe_alofthotel", room_number="A-301", room_type=RoomType.EXECUTIVE_SUITE.value, price_per_night=7200.0, capacity=4),

        # Trident Nariman Point Mumbai
        RoomModel(room_id="rm_tri_101", hotel_id="htl_mum_trident", room_number="T-801", room_type=RoomType.STANDARD.value, price_per_night=9000.0, capacity=2),
        RoomModel(room_id="rm_tri_102", hotel_id="htl_mum_trident", room_number="T-905", room_type=RoomType.DELUXE.value, price_per_night=13500.0, capacity=3),
        RoomModel(room_id="rm_tri_103", hotel_id="htl_mum_trident", room_number="T-1201", room_type=RoomType.PRESIDENTIAL.value, price_per_night=28000.0, capacity=4),
    ]
    for r in rooms:
        db.add(r)
    db.flush()

    # 4. Seed Existing Bookings (Confirmed and Cancelled)
    today = date.today()

    # Confirmed future booking for Arun in rm_res_101
    booking1 = BookingModel(
        booking_id="bkg_demo_conf_1",
        user_id="usr_arun_101",
        room_id="rm_res_101",
        check_in=today + timedelta(days=2),
        check_out=today + timedelta(days=5),
        guest_count=2,
        status=BookingStatus.CONFIRMED,
        total_amount=10500.0,  # 3 nights @ 3500
        created_at=datetime.utcnow() - timedelta(days=2),
        idempotency_key="idemp_key_demo_001"
    )
    db.add(booking1)
    db.flush()

    payment1 = PaymentModel(
        payment_id="pay_demo_001",
        booking_id="bkg_demo_conf_1",
        amount=10500.0,
        payment_status=PaymentStatus.PAID,
        transaction_reference="SIM-TXN-DEMO-PAID-01",
        payment_method="SIMULATED_CARD",
        created_at=datetime.utcnow() - timedelta(days=2),
        updated_at=datetime.utcnow() - timedelta(days=2),
    )
    db.add(payment1)

    # Cancelled future booking for Priya in rm_res_102 (so dates ARE available)
    booking2 = BookingModel(
        booking_id="bkg_demo_canc_2",
        user_id="usr_priya_102",
        room_id="rm_res_102",
        check_in=today + timedelta(days=3),
        check_out=today + timedelta(days=6),
        guest_count=2,
        status=BookingStatus.CANCELLED,
        total_amount=15600.0,  # 3 nights @ 5200
        created_at=datetime.utcnow() - timedelta(days=4),
        idempotency_key="idemp_key_demo_002"
    )
    db.add(booking2)
    db.flush()

    payment2 = PaymentModel(
        payment_id="pay_demo_002",
        booking_id="bkg_demo_canc_2",
        amount=15600.0,
        payment_status=PaymentStatus.REFUNDED,
        transaction_reference="SIM-REF-DEMO-REF-02",
        payment_method="SIMULATED_CARD",
        created_at=datetime.utcnow() - timedelta(days=4),
        updated_at=datetime.utcnow() - timedelta(days=1),
    )
    db.add(payment2)

    db.commit()

    return {
        "hotels_seeded": len(hotels),
        "rooms_seeded": len(rooms),
        "users_seeded": len(users),
        "bookings_seeded": 2
    }


if __name__ == "__main__":
    from .database import SessionLocal
    db = SessionLocal()
    try:
        res = seed_database_tables(db)
        print("Database seeded successfully:", res)
    finally:
        db.close()
